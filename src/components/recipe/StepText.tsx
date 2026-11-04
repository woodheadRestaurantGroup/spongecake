import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import {
  LinkJSXConverter,
  RichText,
  type JSXConvertersFunction,
} from '@payloadcms/richtext-lexical/react'
import React from 'react'

const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({
    internalDocToHref: ({ linkNode }) => {
      const doc = linkNode.fields.doc
      const value = doc?.value
      if (value && typeof value === 'object' && 'slug' in value && typeof value.slug === 'string') {
        return `/recipes/${value.slug}`
      }
      return '#'
    },
  }),
})

/** Renders a rich text field from Payload with links to other recipes resolved. */
export function StepText({ data, className }: { data: unknown; className?: string }) {
  if (!data) return null
  return (
    <RichText data={data as SerializedEditorState} converters={converters} className={className} />
  )
}
