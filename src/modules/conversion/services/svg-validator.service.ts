import { BadRequestException, Injectable } from '@nestjs/common';
import { DOMParser, type Element as XmlElement } from '@xmldom/xmldom';

@Injectable()
export class SvgValidatorService {
  private readonly forbiddenElements = new Set([
    'script',
    'foreignobject',
    'iframe',
    'object',
    'embed',
    'audio',
    'video',
    'animate',
    'animatemotion',
    'animatetransform',
    'set',
  ]);

  validate(input: Buffer): string {
    let svg: string;

    try {
      svg = new TextDecoder('utf-8', {
        fatal: true,
      }).decode(input);
    } catch {
      throw new BadRequestException({
        code: 'INVALID_SVG_ENCODING',
        message: 'SVG must contain valid UTF-8 content.',
      });
    }

    if (/<DOCTYPE|<!ENTITY/i.test(svg)) {
      throw new BadRequestException({
        code: 'UNSAFE_SVG_CONTENT',
        message: 'SVG DTD and entity declarations are not allowed.',
      });
    }

    const parserErrors: string[] = [];

    const parser = new DOMParser({
      onError: (_level, message) => {
        parserErrors.push(message);
      },
    });

    const document = parser.parseFromString(svg, 'image/svg+xml');

    if (parserErrors.length || !document.documentElement || document.doctype) {
      throw new BadRequestException({
        code: 'INVALID_SVG',
        message: 'The uploaded SVG file is invalid.',
      });
    }

    const root = document.documentElement;

    if (root.localName?.toLowerCase() !== 'svg') {
      throw new BadRequestException({
        code: 'INVALID_SVG_ROOT',
        message: 'The document root must be a SVG element.',
      });
    }

    this.validateElement(root);

    return svg;
  }

  private validateElement(element: XmlElement): void {
    const elementName = (element.localName || element.nodeName).toLowerCase();

    if (this.forbiddenElements.has(elementName)) {
      throw new BadRequestException({
        code: 'UNSAFE_SVG_CONTENT',
        message: `SVG element "${elementName}" is not allowed.`,
      });
    }

    for (let index = 0; index < element.attributes.length; index += 1) {
      const attribute = element.attributes.item(index);

      if (!attribute) continue;

      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();

      if (name.startsWith('on') || name === 'src' || name === 'xml:base') {
        throw new BadRequestException({
          code: 'UNSAFE_SVG_ATTRIBUTE',
          message: `SVG attribute "${name}" is not allowed.`,
        });
      }

      if (name === 'href' || name === 'xlink:href') {
        if (!value.startsWith('#')) {
          throw new BadRequestException({
            code: 'EXTERNAL_SVG_RESOURCE',
            message: 'External SVG references are not allowed.',
          });
        }
      }

      if (
        /javascript:|vbscript:|data:/i.test(value) ||
        /@import/i.test(value)
      ) {
        throw new BadRequestException({
          code: 'UNSAFE_SVG_ATRIBUTE',
          message: 'Unsafe SVG attribute value.',
        });
      }

      const urlReferences = value.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi);

      for (const match of urlReferences) {
        if (!match[2].trim().startsWith('#')) {
          throw new BadRequestException({
            code: 'EXTERNAL_SVG_RESOURCE',
            message: 'External SVG resources are not allowed.',
          });
        }
      }
    }

    if (elementName === 'style') {
      const css = element.textContent ?? '';

      if (/@import|javascript:|vbscript:|data:/i.test(css)) {
        throw new BadRequestException({
          code: 'UNSAFE_SVG_CONTENT',
          message: 'Unsafe SVG styles are not allowed.',
        });
      }

      const urlReferences = css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi);

      for (const match of urlReferences) {
        if (!match[2].trim().startsWith('#')) {
          throw new BadRequestException({
            code: 'EXTERNAL_SVG_RESOURCE',
            message: 'External SVG resources are not allowed.',
          });
        }
      }
    }

    for (let index = 0; index < element.childNodes.length; index += 1) {
      const child = element.childNodes.item(index);

      if (child?.nodeType === 1) {
        this.validateElement(child as XmlElement);
      }
    }
  }
}
