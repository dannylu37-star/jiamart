import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { Storage } from '@google-cloud/storage';
import { VendorOrderForm } from './entities/vendor-order-form.entity';
import { VendorProduct } from './entities/vendor-product.entity';

const GCS_BUCKET = process.env.GCS_BUCKET || 'jiamart-files';
const storage = new Storage();

@Injectable()
export class VendorFormService {
  private readonly logger = new Logger(VendorFormService.name);

  constructor(@InjectConnection('ops') private readonly opsConnection: Connection) {}

  async saveUpload(vendorId: number, file: any): Promise<VendorOrderForm> {
    const repo = this.opsConnection.getRepository(VendorOrderForm);
    let storagePath = file.path; // local path (used in dev)

    // 生产环境上传到 GCS
    if (process.env.NODE_ENV === 'production') {
      const gcsPath = `vendor-forms/${vendorId}/${Date.now()}-${file.originalname}`;
      await storage.bucket(GCS_BUCKET).upload(file.path, { destination: gcsPath });
      storagePath = `gs://${GCS_BUCKET}/${gcsPath}`;
      // 删除本地临时文件
      try { fs.unlinkSync(file.path); } catch {}
    }

    return repo.save(
      repo.create({
        vendor_id: vendorId,
        original_filename: file.originalname,
        storage_path: storagePath,
        status: 'pending',
      }),
    );
  }

  async getForms(vendorId: number): Promise<VendorOrderForm[]> {
    const repo = this.opsConnection.getRepository(VendorOrderForm);
    return repo.find({ where: { vendor_id: vendorId }, order: { uploaded_at: 'DESC' } });
  }

  async parseForm(formId: number): Promise<VendorOrderForm> {
    const repo = this.opsConnection.getRepository(VendorOrderForm);
    const form = await repo.findOne({ where: { id: formId } });
    if (!form) throw new NotFoundException(`Form ${formId} not found`);

    const ext = path.extname(form.original_filename).toLowerCase();
    let parsedData: VendorOrderForm['parsed_data'] = [];
    let localPath = form.storage_path;

    try {
      // 如果是 GCS 路径，先下载到 /tmp
      if (form.storage_path.startsWith('gs://')) {
        const gcsPath = form.storage_path.replace(`gs://${GCS_BUCKET}/`, '');
        localPath = `/tmp/vendor-form-${formId}${ext}`;
        await storage.bucket(GCS_BUCKET).file(gcsPath).download({ destination: localPath });
      }

      if (ext === '.xlsx' || ext === '.xls') {
        const XLSX = require('xlsx');
        const workbook = XLSX.readFile(localPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        parsedData = rows.map(row => ({
          product_name: String(row['商品名'] || row['Product'] || row['product_name'] || ''),
          unit: String(row['单位'] || row['Unit'] || row['unit'] || ''),
          unit_price: parseFloat(String(row['单价'] || row['Price'] || row['unit_price'] || '0')) || 0,
          shelf_life_days: parseInt(String(row['保质期(天)'] || row['Shelf Life'] || '0')) || undefined,
          lead_time_days: parseInt(String(row['配送时间(天)'] || row['Lead Time'] || '0')) || undefined,
        })).filter(r => r.product_name);
      } else if (ext === '.pdf') {
        // TODO: PDF 解析 — 接 LLM 或 pdf-parse
        this.logger.warn(`PDF parsing not yet implemented for form ${formId}`);
        parsedData = [];
      }

      // 清理临时文件
      if (form.storage_path.startsWith('gs://')) {
        try { fs.unlinkSync(localPath); } catch {}
      }

      await repo.update(formId, { status: 'parsed', parsed_data: parsedData });
    } catch (e) {
      this.logger.error(`Parse failed for form ${formId}: ${e.message}`);
      await repo.update(formId, { status: 'error', review_notes: e.message });
    }

    return repo.findOne({ where: { id: formId } }) as any;
  }

  async approveForm(formId: number): Promise<{ synced: number }> {
    const formRepo = this.opsConnection.getRepository(VendorOrderForm);
    const prodRepo = this.opsConnection.getRepository(VendorProduct);

    const form = await formRepo.findOne({ where: { id: formId } });
    if (!form) throw new NotFoundException(`Form ${formId} not found`);

    const items = form.parsed_data || [];
    let synced = 0;

    for (const item of items) {
      if (!item.product_name) continue;
      await prodRepo.save(
        prodRepo.create({
          vendor_id: form.vendor_id,
          product_name: item.product_name,
          unit: item.unit || '-',
          unit_price: item.unit_price || 0,
          shelf_life_days: item.shelf_life_days,
          lead_time_days: item.lead_time_days,
          is_active: true,
        }),
      );
      synced++;
    }

    await formRepo.update(formId, { status: 'reviewed', reviewed_at: new Date() });
    return { synced };
  }
}
