import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsString, IsOptional, MinLength, IsNotEmpty, IsNumber } from 'class-validator';
export class UpdateProductDto extends PartialType(CreateProductDto) {

    @IsNumber() id : number;

    @IsString() @IsOptional()
    name?: string;

    @IsString() @IsNotEmpty() @IsOptional()
    sku?: string;

    @MinLength(10)@IsOptional()
    image?: string;

    @IsString()@IsNotEmpty()@IsOptional()
    description?: string;
}
