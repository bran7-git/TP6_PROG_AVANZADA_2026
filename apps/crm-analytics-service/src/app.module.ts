import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CrmAnalyticsController } from './crm-analytics.controller';
import { CrmAnalyticsService } from './crm-analytics.service';
import { EventLog, EventLogSchema } from './schemas/event-log.schema';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/crm_analytics_db'),
    MongooseModule.forFeature([{ name: EventLog.name, schema: EventLogSchema }]),
  ],
  controllers: [CrmAnalyticsController],
  providers: [CrmAnalyticsService],
})
export class AppModule {}