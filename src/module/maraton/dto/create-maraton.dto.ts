import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isFutureDate', async: false })
class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return (
      value instanceof Date &&
      !isNaN(value.getTime()) &&
      value.getTime() > Date.now()
    );
  }

  defaultMessage() {
    return '$property must be a date in the future';
  }
}

export class CreateMaratonDto {
  @ApiProperty({ minLength: 3, example: 'City Marathon 2027' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiPropertyOptional({ minLength: 100, maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MinLength(100)
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  @Validate(IsFutureDateConstraint)
  startDate: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  @Validate(IsFutureDateConstraint)
  endDate: Date;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = false;
}
