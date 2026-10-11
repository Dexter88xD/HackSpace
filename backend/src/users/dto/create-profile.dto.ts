import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateProfileDto {
	@IsOptional()
	@IsString()
	@MaxLength(500)
	bio?: string;

	@IsOptional()
	@IsUrl()
	avatar_url?: string;

	@IsOptional()
	@IsString()
	@MaxLength(100)
	organization_name?: string;

	@IsOptional()
	@IsString()
	@MaxLength(100)
	major?: string;
}