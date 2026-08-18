import bwipjs from 'bwip-js/node'
import type { CodeType, Encoder } from '../session/session'

const BCID: Record<CodeType, string> = {
  '2': 'code39',
  '4': 'code128',
  '11': 'qrcode',
  '12': 'pdf417',
  '13': 'datamatrix',
}

export const encode: Encoder = async (data, codeType) => {
  const png = await bwipjs.toBuffer({
    bcid: BCID[codeType],
    text: data,
    includetext: false,
    backgroundcolor: 'FFFFFF',
    barcolor: '000000',
    paddingwidth: 10,
    paddingheight: 10,
  })
  return `data:image/png;base64,${png.toString('base64')}`
}
