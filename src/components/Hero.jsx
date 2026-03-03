import { useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'

const slides = [
  {
    src: 'https://amazons3-images-micel10.s3.us-east-2.amazonaws.com/images/micelio01.png',
    alt: 'Glowing strands of mycelium'
  },
  {
    src: 'https://amazons3-images-micel10.s3.us-east-2.amazonaws.com/images/micelio04.png',
    alt: 'Mycelium network fragment'
  },
  {
    src: 'https://amazons3-images-micel10.s3.us-east-2.amazonaws.com/images/micelio02.png',
    alt: 'Flowing mycelium tendrils'
  }
]

export function Hero({ onDescend }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' })

  useEffect(() => {
    if (!emblaApi) return
    const id = setInterval(() => {
      emblaApi.scrollNext()
    }, 20000)
    return () => clearInterval(id)
  }, [emblaApi])

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__content">
        <p className="hero__eyebrow">MICEL_10</p>
        <h1 id="hero-title" className="hero__title">
          Una estructura viviente de nodos interconectados.
        </h1>
        <p className="hero__subtitle">Cada nodo que conoces en tu vida puede ser un puente entre conocimientos. Así como el micelio se expande para adaptarse y sobrevivir, esta estrutura se expande para conectar ideas, personas y futuros posibles.</p>
        <div className="hero__actions">
          <button className="hero__cta" onClick={onDescend}>Revisa el micelio</button>
        </div>
      </div>
      <div className="hero__visual" aria-hidden="true">
        {/* <div className="hero__fog-layer" /> */}
        <div className="hero__carousel embla" ref={emblaRef}>
                <div className="embla__container">
                    {slides.map((slide, index) => (
                    <div className="embla__slide" key={slide.src + index}>
                        <figure className="hero__carousel-card">
                        <img
                            className="hero__image"
                            src={slide.src}
                            alt={slide.alt}
                            loading="lazy"
                        />
                        </figure>
                    </div>
                    ))}
                </div>         
        </div>
        <div className="hero__vignette" />
      </div>
    </section>
  )
}
