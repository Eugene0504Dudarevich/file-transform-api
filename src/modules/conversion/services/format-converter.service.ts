import { BadRequestException, Injectable } from '@nestjs/common';
import { parse as parseCsv } from 'csv-parse/sync';
import { stringify as stringifyCsv } from 'csv-stringify/sync';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import XMLBuilder from 'fast-xml-builder';
import YAML from 'yaml';
import { FileFormat } from '../types/conversion.types';
import { isRecord } from '../utils/conversion.utils';
import {
  MAX_STRUCTURE_DEPTH,
  MAX_STRUCTURE_NODES,
} from '../constants/conversion.constants';

@Injectable()
export class FormatConverterService {
  convert(
    input: Buffer,
    sourceFormat: FileFormat,
    targetFormat: FileFormat,
  ): Buffer {
    const source = this.removeBom(input.toString('utf8'));
    const data = this.parse(source, sourceFormat);
    this.validateStructure(data);
    const output = this.serialize(data, targetFormat);

    return Buffer.from(output, 'utf8');
  }

  private parse(source: string, format: FileFormat): unknown {
    try {
      switch (format) {
        case 'json':
          return JSON.parse(source);
        case 'csv':
          return parseCsv(source, {
            bom: true,
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: false,
            max_record_size: 1024 * 1024,
          });
        case 'xml':
          return this.parseXml(source);
        case 'yaml':
          return this.parseYaml(source);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException({
        code: 'INVALID_SOURCE_FILE',
        message: `The uploaded ${format.toUpperCase()} file is invalid.`,
      });
    }
  }

  private parseXml(source: string): unknown {
    if (/<!DOCTYPE|<!ENTITY/i.test(source)) {
      throw new BadRequestException({
        code: 'XML_DTD_NOT_ALLOWED',
        message: 'XML DTD and entity declaration are not allowed.',
      });
    }

    const validation = XMLValidator.validate(source);

    if (!validation) {
      throw new BadRequestException({
        code: 'INVALID_XML',
        message: 'The uploaded XML file is not valid.',
      });
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      processEntities: false,
      parseTagValue: false,
    });

    return parser.parse(source);
  }

  private parseYaml(source: string): unknown {
    const document = YAML.parseDocument(source, {
      version: '1.2',
      schema: 'core',
      uniqueKeys: true,
    });

    if (document.errors.length > 0) {
      throw new BadRequestException({
        code: 'INVALID_YAML',
        message: 'The uploaded YAML file is not valid.',
      });
    }

    return document.toJS({
      maxAliasCount: 0,
      mapAsMap: false,
    });
  }

  private validateStructure(value: unknown): void {
    let nodes = 0;

    const visit = (current: unknown, depth: number): unknown => {
      nodes += 1;

      if (nodes > MAX_STRUCTURE_NODES) {
        throw new BadRequestException({
          code: 'STRUCTURE_TOO_COMPLEX',
          message: 'The uploaded file contains too many elements.',
        });
      }

      if (depth > MAX_STRUCTURE_DEPTH) {
        throw new BadRequestException({
          code: 'MAX_DEPTH_EXCEEDED',
          message: 'The uploaded file is nested too deeply.',
        });
      }

      if (Array.isArray(current)) {
        for (const item of current) {
          visit(item, depth + 1);
        }

        return;
      }

      if (current !== null && typeof current === 'object') {
        for (const item of Object.values(current)) {
          visit(item, depth + 1);
        }
      }
    };

    visit(value, 0);
  }

  private serialize(data: unknown, format: FileFormat): string {
    try {
      switch (format) {
        case 'json':
          return JSON.stringify(data, null, 2);
        case 'csv':
          return this.serializeCsv(data);
        case 'xml':
          return this.serializeXml(data);
        case 'yaml':
          return YAML.stringify(data, {
            version: '1.2',
          });
      }
    } catch {
      throw new BadRequestException({
        code: 'SERIALIZATION_FAILED',
        message: `Could not serialize the data to ${format.toUpperCase()}`,
      });
    }
  }

  private serializeCsv(data: unknown): string {
    if (!Array.isArray(data)) {
      throw new BadRequestException({
        code: 'CSV_REQUIRES_ARRAY',
        message: `CSV output requires an array of objects.`,
      });
    }

    if (!data.length) return '';

    if (!data.every(isRecord)) {
      throw new BadRequestException({
        code: 'CSV_REQUIRES_OBJECT_ROWS',
        message:
          'CSV output requires an array of objects with consistent columns.',
      });
    }

    return stringifyCsv(data, {
      header: true,
      record_delimiter: 'windows',
    });
  }

  private serializeXml(data: unknown): string {
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      format: true,
      processEntities: false,
    });

    return builder.build({
      root: data,
    });
  }

  private removeBom(value: string): string {
    return value.startsWith('\uFEFF') ? value.slice(1) : value;
  }
}
