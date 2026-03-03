import { Segments, Segment } from '@react-three/drei'

export function Connections({ links }) {
  return (
    <Segments limit={1000} lineWidth={1.2}>
      {links.map((link, i) => (
        <Segment 
          key={i} 
          start={link.start} 
          end={link.end} 
          color="#444444" 
        />
      ))}
    </Segments>
  )
}