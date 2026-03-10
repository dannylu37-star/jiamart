import {
  Controller, Get, Post, Put, Param, Body, Query,
  UseGuards, UseInterceptors, UploadedFile, ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VendorService } from './vendor.service';
import { VendorFormService } from './vendor-form.service';

@Controller('vendors')
@UseGuards(JwtAuthGuard)
export class VendorController {
  constructor(
    private readonly vendorService: VendorService,
    private readonly formService: VendorFormService,
  ) {}

  @Get()
  findAll(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.vendorService.findAll(Number(page), Number(limit));
  }

  @Post()
  create(@Body() dto: any) {
    return this.vendorService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vendorService.findOne(id);
  }

  @Post(':id/products')
  addProduct(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.vendorService.addProduct(id, dto);
  }

  @Put(':id/products/:pid')
  updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Param('pid', ParseIntPipe) pid: number,
    @Body() dto: any,
  ) {
    return this.vendorService.updateProduct(id, pid, dto);
  }

  @Post(':id/forms/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = path.join(process.cwd(), 'uploads', 'vendor-forms', req.params.id);
          require('fs').mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}-${file.originalname}`);
        },
      }),
    }),
  )
  uploadForm(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any,
  ) {
    return this.formService.saveUpload(id, file);
  }

  @Get(':id/forms')
  getForms(@Param('id', ParseIntPipe) id: number) {
    return this.formService.getForms(id);
  }

  @Post('forms/:formId/parse')
  parseForm(@Param('formId', ParseIntPipe) formId: number) {
    return this.formService.parseForm(formId);
  }

  @Post('forms/:formId/approve')
  approveForm(@Param('formId', ParseIntPipe) formId: number) {
    return this.formService.approveForm(formId);
  }
}
