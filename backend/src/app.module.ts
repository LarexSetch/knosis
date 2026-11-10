import { Module } from '@nestjs/common';
import { OntologyModule } from './ontology/ontology.module';

@Module({
  imports: [OntologyModule],
})
export class AppModule {}
