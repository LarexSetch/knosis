import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { OntologyModule } from './ontology/ontology.module';
import { KnowledgeModule } from './knowlage/knowledge.module';

@Module({
  imports: [DatabaseModule, OntologyModule, KnowledgeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
