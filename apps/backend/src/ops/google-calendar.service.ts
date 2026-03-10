/**
 * GoogleCalendarService
 * 负责将排班推送到员工个人 Google Calendar
 *
 * 环境变量（与现有 Google OAuth 共用）:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 *   GOOGLE_CALENDAR_ID   - 主排班日历 ID（可留空，默认用员工 primary）
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, calendar_v3 } from 'googleapis';

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(private config: ConfigService) {}

  private getCalendar() {
    const auth = new google.auth.OAuth2(
      this.config.get('GOOGLE_CLIENT_ID'),
      this.config.get('GOOGLE_CLIENT_SECRET'),
    );
    auth.setCredentials({ refresh_token: this.config.get('GOOGLE_REFRESH_TOKEN') });
    return google.calendar({ version: 'v3', auth });
  }

  /**
   * 为某员工的排班创建日历事件
   * @param staffEmail 员工 Google 邮箱
   * @param shift      排班对象（shiftDate, startTime, endTime, notes, storeName?）
   * @returns Google Calendar event ID，失败返回 null（不阻断主流程）
   */
  async createShiftEvent(
    staffEmail: string,
    shift: {
      shiftDate: string;
      startTime: string;
      endTime: string;
      notes?: string;
      storeName?: string;
    },
  ): Promise<string | null> {
    const calendarId = this.config.get('GOOGLE_CALENDAR_ID', 'primary');
    const summary = `排班 - ${shift.storeName ?? 'Jiamart'}`;
    const start = `${shift.shiftDate}T${shift.startTime}`;
    const end = `${shift.shiftDate}T${shift.endTime}`;

    const event: calendar_v3.Schema$Event = {
      summary,
      description: shift.notes ?? '',
      start: { dateTime: start, timeZone: 'Europe/London' },
      end: { dateTime: end, timeZone: 'Europe/London' },
      attendees: [{ email: staffEmail }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'email', minutes: 1440 }, // 前一天邮件提醒
        ],
      },
    };

    try {
      const cal = this.getCalendar();
      const res = await cal.events.insert({ calendarId, requestBody: event, sendUpdates: 'all' });
      this.logger.log(`Calendar event created for ${staffEmail}: ${res.data.id}`);
      return res.data.id ?? null;
    } catch (err: any) {
      this.logger.warn(`Failed to create calendar event for ${staffEmail}: ${err.message}`);
      return null; // 不让日历失败阻断排班保存
    }
  }

  /**
   * 删除日历事件（排班取消时）
   */
  async deleteShiftEvent(eventId: string): Promise<void> {
    const calendarId = this.config.get('GOOGLE_CALENDAR_ID', 'primary');
    try {
      const cal = this.getCalendar();
      await cal.events.delete({ calendarId, eventId });
      this.logger.log(`Calendar event deleted: ${eventId}`);
    } catch (err: any) {
      this.logger.warn(`Failed to delete calendar event ${eventId}: ${err.message}`);
    }
  }
}
