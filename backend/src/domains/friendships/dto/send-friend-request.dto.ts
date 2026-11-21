import { Min, IsInt } from 'class-validator';

export class SendFriendRequestDto {
    @IsInt()
    @Min(1)
    addresseeId!: number;
}

