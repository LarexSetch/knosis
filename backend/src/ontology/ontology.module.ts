import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OntologyController } from './ontology.controller';
import { OntologyEntity } from './ontology.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OntologyEntity])],
  controllers: [OntologyController],
})
export class OntologyModule {}
