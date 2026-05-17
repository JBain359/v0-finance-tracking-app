import { createClient } from '@/lib/supabase/server'
import { UploadForm } from '@/components/upload/upload-form'
import { StatementsList } from '@/components/upload/statements-list'
import type { Statement } from '@/lib/types'

async function getStatements() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('statements')
    .select('*')
    .order('uploaded_at', { ascending: false })
  
  return (data || []) as Statement[]
}

export default async function UploadPage() {
  const statements = await getStatements()

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Upload Statements</h1>
        <p className="text-muted-foreground">
          Upload your bank or credit card statements as CSV or PDF files
        </p>
      </div>
      
      <div className="grid gap-8 lg:grid-cols-2">
        <UploadForm />
        <StatementsList statements={statements} />
      </div>
    </div>
  )
}
