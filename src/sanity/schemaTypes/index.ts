import { type SchemaTypeDefinition } from 'sanity'

import {localeString} from './objects/localeString'
import {localeText} from './objects/localeText'
import {localeBlock} from './objects/localeBlock'
import {seo} from './objects/seo'

import {project} from './documents/project'
import {service} from './documents/service'
import {post} from './documents/post'
import {legalPage} from './documents/legalPage'
import {siteSettings} from './documents/siteSettings'

const schemaTypes = [
  // objects
  localeString,
  localeText,
  localeBlock,
  seo,
  // documents
  siteSettings,
  project,
  service,
  post,
  legalPage,
]

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    ...schemaTypes,
  ],
}
