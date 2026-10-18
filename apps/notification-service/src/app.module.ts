import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { ProcessedEvent, ProcessedEventSchema } from './schemas/processed-event.schema';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/notification_db'),
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: ProcessedEvent.name, schema: ProcessedEventSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class AppModule {}