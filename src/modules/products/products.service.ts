import { Injectable, Req } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { response } from 'src/utils/response';
import { InjectRepository } from '@nestjs/typeorm';
import { Products } from './entities/product.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductsService {
  constructor(@InjectRepository(Products)
  private readonly Products: Repository<Products>) { }
  async create(createProductDto: CreateProductDto, Req: any) {
    try {
      const exist = await this.Products.findOne({ where: { name: createProductDto.name, addedBy : Req.identity.id } });
      if (exist) {
        return response.failed(null, 'Product with this name already exists');
      }
      const newProduct = await this.Products.create(createProductDto);
      return response.success(newProduct, 'Product created successfully');

    } catch (error) {
      return response.failed(null, 'Failed to create product');
    }
  }

  findAll() {
    return `This action returns all products`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
