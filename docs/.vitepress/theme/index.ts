import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './custom.css'

import MegaNav from './components/MegaNav.vue'
import Breadcrumbs from './components/Breadcrumbs.vue'
import SiteFooter from './components/SiteFooter.vue'
import AffiliateButton from './components/AffiliateButton.vue'
import BrandCard from './components/BrandCard.vue'
import BrandFilter from './components/BrandFilter.vue'
import BrandSnapshot from './components/BrandSnapshot.vue'
import PlanTable from './components/PlanTable.vue'
import PerformanceReport from './components/PerformanceReport.vue'
import AvailabilityMatrix from './components/AvailabilityMatrix.vue'
import NetworkPathDiagram from './components/NetworkPathDiagram.vue'
import ClientSelector from './components/ClientSelector.vue'
import TroubleshootingWizard from './components/TroubleshootingWizard.vue'
import HomeWorkspace from './components/HomeWorkspace.vue'
import RelatedResources from './components/RelatedResources.vue'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-content-before': () => h(MegaNav, { mode: 'desktop' }),
      'nav-screen-content-before': () => h(MegaNav, { mode: 'mobile' }),
      'doc-before': () => h(Breadcrumbs),
      'doc-after': () => h(RelatedResources),
      'layout-bottom': () => h(SiteFooter),
    })
  },
  enhanceApp({ app }) {
    app.component('AffiliateButton', AffiliateButton)
    app.component('BrandCard', BrandCard)
    app.component('BrandFilter', BrandFilter)
    app.component('BrandSnapshot', BrandSnapshot)
    app.component('PlanTable', PlanTable)
    app.component('PerformanceReport', PerformanceReport)
    app.component('AvailabilityMatrix', AvailabilityMatrix)
    app.component('NetworkPathDiagram', NetworkPathDiagram)
    app.component('ClientSelector', ClientSelector)
    app.component('TroubleshootingWizard', TroubleshootingWizard)
    app.component('HomeWorkspace', HomeWorkspace)
    app.component('RelatedResources', RelatedResources)
  },
} satisfies Theme
