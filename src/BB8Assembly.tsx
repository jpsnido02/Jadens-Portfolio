import {useId} from "react"

const FINISHED = "/projects/build-view/bb8-finished-view.jpg"
const BEFORE = "/projects/build-view/bb8-antenna-step117.jpg"
// Finished-model context from page 87; the receiving rod is the actual before-view
// in step 118. No connector, cap geometry, or ground shadow is drawn by hand.
const BODY = "M225 195Q200 193 178 207Q155 214 145 235L133 251 128 275 129 296 147 309 146 321 130 331 113 343 96 361 81 387 73 408 66 440 67 479 72 511 81 536 94 551 83 551 91 570 108 589 126 602 136 606 139 598 153 605 182 606 207 606 229 609 253 611 267 616 284 615 310 608 333 593 353 574 368 553 378 531 384 507 385 490 393 478 393 447 386 440 383 408 374 382 359 358 342 340 325 326 308 318 308 313Q323 308 320 289L318 268Q311 242 298 232L295 223 285 210Q260 195 242 195Z M228 196 227 184 230 182 230 133Q234 129 239 133L239 182 242 184 242 196Z M286 231 286 194 289 191 289 102 288 95 284 73 285 65Q295 59 304 64L306 69 303 91 301 96 301 103 300 191 303 195 303 215 299 222 300 233Z"
const CAP = "M284.4,69.8 286.6,64.6 287.6,63.5 292.9,62.4 298.2,62.4 303.4,63.5 304.4,65.6 305.5,68.7 305.6,76.1 303.3,86.5 301.2,94.6 288.8,94.6 286.6,85.5 284.4,74.0Z"
const BARE_ROD = "M475.0,215.7 477.0,199.7 478.0,198.7 483.0,198.7 484.0,200.7 486.1,218.7 482.0,310.3 481.0,312.3 479.0,313.3 476.0,313.3 475.0,311.3Z"
const ANTENNA = "M282 58H310V193H284Z"
export function BB8Part() {
    const id=useId().replace(/:/g,"")
    return <svg viewBox="278 55 36 48" role="img" aria-label="One black cone-shaped antenna tip"><defs><clipPath id={`tip-${id}`}><path d={CAP}/></clipPath></defs><image href={FINISHED} width="800" height="722" clipPath={`url(#tip-${id})`}/></svg>
}
export default function BB8Assembly({phase}:{phase:number}) {
    const id=useId().replace(/:/g,"")
    const placed=phase===1 || phase===2
    return <svg className="build-assembly bb8-assembly" viewBox="0 0 800 600" role="img" aria-label="A recognizable, nearly finished BB-8. One black antenna tip slides onto its existing white rod, using the actual before and after illustrations from the manual.">
        <defs>
            <clipPath id={`body-${id}`}><path d={BODY}/></clipPath>
            <clipPath id={`cap-${id}`}><path d={CAP}/></clipPath>
            <clipPath id={`rod-${id}`}><path d={BARE_ROD}/></clipPath>
            <mask id={`without-tip-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="722"><rect width="800" height="722" fill="white"/><path d={ANTENNA} fill="black"/></mask>
        </defs>
        <g className="bb8-droid-view" transform="translate(300 10) scale(.76)">
            <g clipPath={`url(#body-${id})`}><image href={FINISHED} width="800" height="722" mask={`url(#without-tip-${id})`}/></g>
            <g transform="matrix(1 0 .013 1 -188.587 -120)"><image href={BEFORE} width="800" height="722" clipPath={`url(#rod-${id})`}/></g>
            <g className={`build-placement-arrow ${phase===0?"is-visible":""}`}><path d="M318 57v33m-5-7 5 7 5-7"/></g>
            <g className={`build-moving-part bb8-antenna-tip ${phase===0?"is-ready":""} ${placed?"is-placed":""}`}><image href={FINISHED} width="800" height="722" clipPath={`url(#cap-${id})`}/></g>
        </g>
    </svg>
}
