import { useEffect, useRef, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXmark } from "@fortawesome/free-solid-svg-icons"
import "./ebay-product-ads.css"

// Illustrative offer copy and order number follow the supplied Figma reference.
const products = [
    { id: "foundation", name: "Color Changing Foundation", image: "foundation.jpg", price: 49 },
    { id: "liner", name: "Luxury Lip Liner", image: "lip-liner.jpg", price: 19 },
    { id: "mask", name: "Ultra Peptide & Collagen Lifting Mask", image: "mask.jpg", price: 44 },
    { id: "blender", name: "Smooche Blender", image: "blender.jpg", price: 9 },
]

/** Static offer artwork: the gallery card is the only interactive target. */
export default function EbayProductAds() {
    const root = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(0)
    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect
            // Scale the complete desktop composition uniformly at every viewport size.
            setScale(Math.min(width / 960, height / 808))
        })
        observer.observe(root.current!)
        return () => observer.disconnect()
    }, [])

    return <div ref={root} className="ebay-dpa">
        <div className="ebay-dpa-scene" style={{ transform: `translate(-50%, -50%) scale(${scale})`, visibility: scale ? "visible" : "hidden" }}>
            <section className="ebay-dpa-panel">
                <header className="ebay-dpa-header">
                    <img src="/projects/agent-logos/ebay.svg" alt="eBay" className="ebay-dpa-logo" />
                    <span>Order number: 123456789</span>
                    <span className="ebay-dpa-close"><FontAwesomeIcon icon={faXmark} /></span>
                </header>
                <div className="ebay-dpa-offer">
                    <h3>You’ve unlocked an exclusive 40% discount at Smooche!</h3>
                    <div className="ebay-dpa-brand-row">
                        <span className="ebay-dpa-advertiser"><img src="/projects/ebay-dpa/smooche-icon.svg" alt="" /><span>Smooche</span></span>
                        <span className="ebay-dpa-discount">40% OFF</span>
                    </div>
                </div>
                <div className="ebay-dpa-actions">
                    <span className="ebay-dpa-shop">Shop Now</span>
                    <span className="ebay-dpa-decline">Decline</span>
                </div>
            </section>
            {/* A separate foreground layer lets complete cards and shadows clear the modal. */}
            <div className="ebay-dpa-products">
                {products.map(item => <article className="ebay-dpa-product" key={item.id}>
                    <img className="ebay-dpa-product-image" src={`/projects/ebay-dpa/${item.image}`} alt="" />
                    <div className="ebay-dpa-product-copy">
                        <h4>{item.name}</h4>
                        <span className="ebay-dpa-product-price">${item.price.toFixed(2)}</span>
                    </div>
                </article>)}
            </div>
        </div>
    </div>
}
