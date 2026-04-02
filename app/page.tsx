import type { Metadata } from 'next'
import LandingExperience from '@/components/home/LandingExperience'

export const metadata: Metadata = {
  title: 'SQUAD — Run your kickabout properly',
  description:
    'Availability, payments, and balanced teams for 5/6/7-a-side. Less group-chat chaos, more minutes on the pitch.',
}

export default function HomePage() {
  return <LandingExperience />
}
