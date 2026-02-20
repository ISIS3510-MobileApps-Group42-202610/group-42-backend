import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsBoolean,
} from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsUUID()
  @IsNotEmpty()
  receiverId: string;
}

export class UpdateMessageDto {
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}

export class MessageResponseDto {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  sentAt: Date;
  isRead: boolean;
}

export class MessageDetailResponseDto extends MessageResponseDto {
  sender?: {
    id: string;
    fullName: string;
    profilePhotoUrl: string;
  };
  receiver?: {
    id: string;
    fullName: string;
    profilePhotoUrl: string;
  };
}
