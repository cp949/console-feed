import * as React from 'react'
import { render, screen } from '@testing-library/react'

import Console from '..'

const makeLog = (data: any[]) =>
  ({
    method: 'log',
    id: 'id',
    data,
  }) as const

it('renders', () => {
  render(<Console logs={[makeLog(['my-log'])]} />)

  expect(screen.getByText('my-log')).toBeInTheDocument()
})

it('formats messages', () => {
  const { container } = render(
    <Console
      logs={[
        makeLog([
          '%ctest',
          'color: red',
          'foo',
          [2, '__console_feed_remaining__0'],
        ]),
      ]}
    />,
  )

  expect(container.querySelector('span[style*="color: red;"]')).toBeTruthy()
  expect(
    container.querySelector('span[style*="color: rgb(28, 0, 207);"]'),
  ).toBeTruthy()
  expect(screen.getByText(/foo/)).toBeInTheDocument()
})

it('various data types', () => {
  render(
    <Console
      logs={[
        makeLog([
          1,
          'test',
          { foo: 'bar' },
          [1, 2, 3, 4, 5],
          [],
          [{}],
          {},
          null,
        ]),
      ]}
    />,
  )

  expect(screen.getByText('test')).toBeInTheDocument()
  expect(screen.getAllByText(/foo/)).toHaveLength(1)
  expect(screen.getByText(/bar/)).toBeInTheDocument()
})

it('skips non-existent substitution', () => {
  render(<Console logs={[makeLog(['%u', 'foo'])]} />)

  expect(screen.getByText('%u')).toBeInTheDocument()
  expect(screen.getByText('foo')).toBeInTheDocument()
})

it('displays object names', () => {
  render(<Console logs={[makeLog([new (class MyObject {})()])]} />)

  expect(screen.getByText('MyObject')).toBeInTheDocument()
})

it('linkify object', () => {
  const { container } = render(
    <Console logs={[makeLog(['hello https://example.com'])]} />,
  )

  expect(container.innerHTML).toContain(
    '<a href="https://example.com">https://example.com</a>',
  )
})

it('linkify object and pass options', () => {
  const { container } = render(
    <Console
      logs={[makeLog(['hello https://example.com'])]}
      linkifyOptions={{
        attributes: (href, type) => (type === 'url' ? { rel: 'nofollow' } : {}),
      }}
    />,
  )

  expect(container.innerHTML).toContain('rel="nofollow"')
})

it('allows all types methods', () => {
  expect(() =>
    render(
      <Console
        logs={[
          makeLog([]),
          { method: 'debug', id: 'id', data: [] },
          { method: 'info', id: 'id', data: [] },
          { method: 'warn', id: 'id', data: [] },
          { method: 'error', id: 'id', data: [] },
          { method: 'table', id: 'id', data: [] },
          { method: 'clear', id: 'id', data: [] },
          { method: 'time', id: 'id', data: [] },
          { method: 'timeEnd', id: 'id', data: [] },
          { method: 'count', id: 'id', data: [] },
          { method: 'assert', id: 'id', data: [] },
          { method: 'result', id: 'id', data: [] },
          { method: 'command', id: 'id', data: [] },
        ]}
      />,
    ),
  ).not.toThrow()
})

it('displays limited arrays correctly', () => {
  render(
    <Console
      logs={[
        makeLog([
          [...Array.from(Array(100).keys()), '__console_feed_remaining__99899'],
        ]),
      ]}
    />,
  )

  expect(screen.getByText('(99999)')).toBeInTheDocument()
  expect(screen.getByText('…')).toBeInTheDocument()
})

it('displays nested limited arrays correctly', () => {
  const { container } = render(
    <Console
      logs={[makeLog([[[[Array.from(Array(10).keys())], '--separator--']]])]}
    />,
  )

  expect(container.innerHTML).toContain('Array(2)')
})
