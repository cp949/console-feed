import * as React from 'react'
import DOMPurify from 'isomorphic-dompurify'
import { Root } from '../react-inspector/elements'

import Format from '../devtools-parser'

interface Props {
  data: any[]
}

class Formatted extends React.PureComponent<Props, any> {
  render() {
    const formatted = Format(this.props.data || [])
    const sanitized = DOMPurify.sanitize(formatted)

    return (
      <Root
        data-type="formatted"
        dangerouslySetInnerHTML={{
          __html: sanitized,
        }}
      />
    )
  }
}

export default Formatted
