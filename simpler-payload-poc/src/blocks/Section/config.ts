import type { Block, Field } from 'payload'

import { Content } from '../Content/config'
import { MediaBlock } from '../MediaBlock/config'
import { FormBlock } from '../Form/config'

const columnFields: Field[] = [
  {
    name: 'size',
    type: 'select',
    defaultValue: 'oneThird',
    options: [
      {
        label: 'One Third',
        value: 'oneThird',
      },
      {
        label: 'Half',
        value: 'half',
      },
      {
        label: 'Two Thirds',
        value: 'twoThirds',
      },
      {
        label: 'Full',
        value: 'full',
      },
    ],
  },
  {
    name: 'sectionContent',
    type: 'blocks',
    blocks: [Content, MediaBlock, FormBlock],
  },
]

export const Section: Block = {
  slug: 'section',
  interfaceName: 'SectionBlock',
  fields: [
    {
      name: 'columns',
      type: 'array',
      admin: {
        initCollapsed: true,
      },
      fields: columnFields,
    },
  ],
}
