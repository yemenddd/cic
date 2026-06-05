'use client'

import { useState } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { Provider as StyletronProvider } from 'styletron-react'
import { Client as StyletronClient } from 'styletron-engine-atomic'
import { Server as StyletronServer } from 'styletron-engine-atomic'
import { BaseProvider, LightTheme, DarkTheme } from 'baseui'

export default function StyletronWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const [styletron] = useState(() => {
    return typeof window === 'undefined'
      ? new StyletronServer()
      : new StyletronClient()
  })

  useServerInsertedHTML(() => {
    if (typeof window !== 'undefined') {
      return null
    }
    const styles = (styletron as StyletronServer).getStylesheets()
    return (
      <>
        {styles.map((sheet, i) => (
          <style
            className="_styletron_hydrate_"
            dangerouslySetInnerHTML={{ __html: sheet.css }}
            media={sheet.attrs.media}
            data-hydrate={sheet.attrs['data-hydrate']}
            key={i}
          />
        ))}
      </>
    )
  })

  return (
    <StyletronProvider value={styletron}>
      <BaseProvider theme={DarkTheme}>
        {children}
      </BaseProvider>
    </StyletronProvider>
  )
}
