import { PartialType } from '@nestjs/swagger';
import { CreateMaratonDto } from './create-maraton.dto.js';

export class UpdateMaratonDto extends PartialType(CreateMaratonDto) {}
