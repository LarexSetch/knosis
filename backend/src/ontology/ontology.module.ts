import { Module } from '@nestjs/common';
import { FileOntologyStorageService } from './file-ontology-storage.service';
import { OntologyController } from './ontology.controller';
import { ONTOLOGY_STORAGE } from './ontology-storage.interface';

@Module({
  controllers: [OntologyController],
  providers: [
    FileOntologyStorageService,
    {
      provide: ONTOLOGY_STORAGE,
      useExisting: FileOntologyStorageService,
    },
  ],
  exports: [ONTOLOGY_STORAGE],
})
export class OntologyModule {}
