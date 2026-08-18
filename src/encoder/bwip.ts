import { toCanvas, toSVG } from 'bwip-js/browser'
import type { CodeType, Encoder } from '../session/session'

const BCID: Record<CodeType, string> = {
  '2': 'code39',
  '4': 'code128',
  '11': 'qrcode',
  '12': 'pdf417',
  '13': 'datamatrix',
}

function renderOpts(data: string, codeType: CodeType) {
  return {
    bcid: BCID[codeType],
    text: data,
    includetext: false,
    backgroundcolor: 'FFFFFF',
    barcolor: '000000',
    paddingwidth: 10,
    paddingheight: 10,
  }
}

export const encode: Encoder = async (data, codeType) => {
  const options = renderOpts(data, codeType)
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas')
    toCanvas(canvas, options)
    return canvas.toDataURL('image/png')
  }
  const svg = toSVG(options)
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
