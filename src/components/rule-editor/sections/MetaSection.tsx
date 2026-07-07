import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FieldLabel } from '@/components/common/FieldHint'
import {
  PARANOIA_LEVELS,
  PHASES,
  SEVERITIES,
  syncParanoiaTag,
  TAG_PRESETS,
} from '@/constants/crsRuleSchema'
import { useTranslation } from '@/i18n'
import type { ParsedRule } from '@/types/rules'

interface MetaSectionProps {
  rule: ParsedRule
  onChange: (rule: ParsedRule) => void
}

export function MetaSection({ rule, onChange }: MetaSectionProps) {
  const { t } = useTranslation()
  const [tagsInput, setTagsInput] = useState(() => (rule.metadata.tags ?? []).join(', '))
  const [tagsFocused, setTagsFocused] = useState(false)

  useEffect(() => {
    if (!tagsFocused) {
      setTagsInput((rule.metadata.tags ?? []).join(', '))
    }
  }, [rule.metadata.tags, tagsFocused])

  useEffect(() => {
    setTagsInput((rule.metadata.tags ?? []).join(', '))
    setTagsFocused(false)
  }, [rule.internalId])

  const updateMetadata = (patch: Partial<ParsedRule['metadata']>) => {
    const next = { ...rule.metadata, ...patch }
    if ('paranoiaLevel' in patch) {
      next.tags = syncParanoiaTag(next.tags, patch.paranoiaLevel)
    }
    onChange({ ...rule, metadata: next })
  }

  const parseTagsInput = (value: string): string[] => (
    value.split(',').map((tag) => tag.trim()).filter(Boolean)
  )

  const commitTagsInput = () => {
    const parsed = parseTagsInput(tagsInput)
    updateMetadata({ tags: parsed })
    setTagsInput(parsed.join(', '))
  }

  const addTag = (tag: string) => {
    const tags = rule.metadata.tags ?? []
    if (tags.includes(tag)) return
    const next = [...tags, tag]
    updateMetadata({ tags: next })
    setTagsInput(next.join(', '))
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <FieldLabel label={t('meta.id')} hint={t('hints.meta.id')} htmlFor="rule-id" />
        <Input
          id="rule-id"
          type="number"
          value={rule.metadata.id}
          onChange={(event) => updateMetadata({ id: Number(event.target.value) })}
        />
        <p className="text-xs text-muted-foreground">
          {t('meta.idRanges', {
            local: t('schema.idRanges.local'),
            request: t('schema.idRanges.request'),
            response: t('schema.idRanges.response'),
          })}
        </p>
      </div>
      <div className="space-y-2">
        <FieldLabel label={t('meta.severity')} hint={t('hints.meta.severity')} />
        <Select value={rule.metadata.severity ?? ''} onValueChange={(value) => updateMetadata({ severity: value })}>
          <SelectTrigger><SelectValue placeholder={t('meta.selectSeverity')} /></SelectTrigger>
          <SelectContent>
            {SEVERITIES.map((severity) => (
              <SelectItem key={severity} value={severity}>{severity}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <FieldLabel label={t('meta.paranoiaLevel')} hint={t('hints.meta.paranoiaLevel')} />
        <Select
          value={rule.metadata.paranoiaLevel ?? ''}
          onValueChange={(value) => updateMetadata({ paranoiaLevel: value as ParsedRule['metadata']['paranoiaLevel'] })}
        >
          <SelectTrigger><SelectValue placeholder={t('meta.selectParanoiaLevel')} /></SelectTrigger>
          <SelectContent>
            {PARANOIA_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>
                PL {level} — {t(`schema.paranoiaLevels.${level}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <FieldLabel label={t('meta.message')} hint={t('hints.meta.message')} htmlFor="rule-msg" />
        <Input
          id="rule-msg"
          value={rule.metadata.message ?? ''}
          onChange={(event) => updateMetadata({ message: event.target.value })}
          placeholder={t('meta.messagePlaceholder')}
        />
      </div>
      <div className="space-y-2">
        <FieldLabel label={t('meta.rev')} hint={t('hints.meta.rev')} htmlFor="rule-rev" />
        <Input id="rule-rev" value={rule.metadata.rev ?? ''} onChange={(event) => updateMetadata({ rev: event.target.value })} />
      </div>
      <div className="space-y-2">
        <FieldLabel label={t('meta.ver')} hint={t('hints.meta.ver')} htmlFor="rule-ver" />
        <Input
          id="rule-ver"
          value={rule.metadata.ver ?? ''}
          onChange={(event) => updateMetadata({ ver: event.target.value })}
          placeholder={t('meta.verPlaceholder')}
        />
      </div>
      <div className="space-y-2">
        <FieldLabel label={t('meta.maturity')} htmlFor="rule-maturity" />
        <Input id="rule-maturity" value={rule.metadata.maturity ?? ''} onChange={(event) => updateMetadata({ maturity: event.target.value })} />
      </div>
      <div className="space-y-2">
        <FieldLabel label={t('meta.accuracy')} htmlFor="rule-accuracy" />
        <Input id="rule-accuracy" value={rule.metadata.accuracy ?? ''} onChange={(event) => updateMetadata({ accuracy: event.target.value })} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <div className="flex items-center gap-1">
          <FieldLabel label={t('meta.tags')} hint={t('hints.meta.tags')} htmlFor="rule-tags" />
        </div>
        <Input
          id="rule-tags"
          value={tagsInput}
          placeholder={t('meta.tagsPlaceholder')}
          onFocus={() => setTagsFocused(true)}
          onBlur={() => {
            setTagsFocused(false)
            commitTagsInput()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commitTagsInput()
              event.currentTarget.blur()
            }
          }}
          onChange={(event) => setTagsInput(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {Object.entries(TAG_PRESETS).map(([group, presets]) => (
            presets.map((tag) => (
              <Button key={`${group}-${tag}`} type="button" variant="outline" size="sm" onClick={() => addTag(tag)}>
                {tag}
              </Button>
            ))
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(rule.metadata.tags ?? []).map((tag) => (
            <Badge key={tag} className="bg-secondary text-secondary-foreground">{tag}</Badge>
          ))}
        </div>
      </div>
      <div className="space-y-2 md:col-span-2">
        <FieldLabel label={t('meta.comment')} htmlFor="rule-comment" />
        <Input id="rule-comment" value={rule.metadata.comment ?? ''} onChange={(event) => updateMetadata({ comment: event.target.value })} />
      </div>
      <div className="space-y-2">
        <FieldLabel label={t('meta.phase')} hint={t('hints.meta.phase')} />
        <Select value={rule.metadata.phase} onValueChange={(value) => updateMetadata({ phase: value })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PHASES.map((phase) => (
              <SelectItem key={phase} value={phase}>
                {t('meta.phaseLabel', { n: phase, desc: t(`schema.phaseDescriptions.${phase}`) })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
