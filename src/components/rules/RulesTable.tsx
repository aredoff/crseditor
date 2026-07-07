import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n'
import { getRuleDescription } from '@/lib/ruleAdapters'
import type { ParsedRule } from '@/types/rules'

interface RulesTableProps {
  rules: ParsedRule[]
  onEdit: (internalId: string) => void
  onDuplicate: (internalId: string) => void
  onDelete: (internalId: string) => void
}

export function RulesTable({ rules, onEdit, onDuplicate, onDelete }: RulesTableProps) {
  const { t } = useTranslation()

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">{t('rulesTable.description')}</th>
            <th className="px-4 py-3 text-left font-medium">{t('rulesTable.severity')}</th>
            <th className="px-4 py-3 text-right font-medium">{t('rulesTable.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.internalId} className="border-t">
              <td className="px-4 py-3">{getRuleDescription(rule, t)}</td>
              <td className="px-4 py-3">{rule.metadata.severity ?? '—'}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(rule.internalId)}>
                    {t('common.edit')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDuplicate(rule.internalId)}>
                    {t('common.duplicate')}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">{t('common.delete')}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('rulesTable.deleteTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('rulesTable.deleteDescription')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(rule.internalId)}>
                          {t('common.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
