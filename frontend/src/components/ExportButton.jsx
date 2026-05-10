export default function ExportButton({ data, fileName = 'export' }) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('No data to export')
      return
    }

    const headers = Object.keys(data[0])
    const csv = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header]
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <button
      onClick={handleExport}
      style={{
        padding: '8px 16px',
        background: '#27AE60',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '600'
      }}
    >
      📥 Export CSV
    </button>
  )
}