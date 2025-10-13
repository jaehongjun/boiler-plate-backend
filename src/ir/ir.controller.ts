import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { IrService, type IrActivity } from './ir.service';

const AttachmentSchema = z.object({
  id: z.string().optional(),
  filename: z.string().min(1),
  url: z.string().url(),
});

const CreateIrSchema = z.object({
  title: z.string().min(1),
  type: z.string().min(1),
  meetingAt: z.string().datetime().optional(),
  place: z.string().optional(),
  broker: z.string().optional(),
  brokerPerson: z.string().optional(),
  investor: z.string().optional(),
  investorPerson: z.string().optional(),
  attachments: z.array(AttachmentSchema).default([]),
});

type CreateIrDto = z.infer<typeof CreateIrSchema>;

@Controller()
export class IrController {
  constructor(private readonly irService: IrService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Post('ir/activities')
  createAtRoot(@Body(new ZodValidationPipe(CreateIrSchema)) body: CreateIrDto) {
    const created: IrActivity = this.irService.create({
      title: body.title,
      type: body.type,
      meetingAt: body.meetingAt,
      place: body.place,
      broker: body.broker,
      brokerPerson: body.brokerPerson,
      investor: body.investor,
      investorPerson: body.investorPerson,
      attachments: body.attachments,
    });
    return {
      success: true,
      data: created,
      message: 'CREATED',
    } as const;
  }
  // '/api/ir/activities' 경로는 필요 시 별도 추가 가능. 기본은 루트 '/ir/activities' 사용.
}
