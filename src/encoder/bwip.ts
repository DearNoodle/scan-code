import { toSVG } from 'bwip-js/browser'
import type { CodeType, Encoder } from '../session/session'

const BCID: Record<CodeType, string> = {
  '2': 'code39',
  '4': 'code128',
  '11': 'qrcode',
  '12': 'pdf417',
  '13': 'datamatrix',
}

export const encode: Encoder = async (data, codeType) => {
  const svg = toSVG({
    bcid: BCID[codeType],
    text: data,
    includetext: false,
    backgroundcolor: 'FFFFFF',
    barcolor: '000000',
    paddingwidth: 10,
    paddingheight: 10,
  })
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
