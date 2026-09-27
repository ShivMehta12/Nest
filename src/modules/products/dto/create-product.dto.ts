import { IsString,  IsNotEmpty, MinLength } from 'class-validator';
export class CreateProductDto {
    @IsString()
    name: string;

    @IsString() @IsNotEmpty()
    sku: string;
    @MinLength(10)

    @IsNotEmpty()
    image: string;

    @IsNotEmpty() @IsString()
    description: string;
  }
  