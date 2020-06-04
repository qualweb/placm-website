import { environment } from '../environments/environment';

const BASE_URL = environment.production ? '/' : 'http://localhost:3443/' ;

const POSSIBLE_FILTERS = ['continentIds', 'countryIds', 'sectorIds', 'orgIds', 'tagIds', 'appIds', 'evalIds', 'ruleIds', 'filter', 'p'];

const LABELS_PLURAL = {
  'continent': 'Continents',
  'country': 'Countries',
  'sector': 'Sectors',
  'tag': 'Tags',
  'org': 'Organizations',
  'app': 'Applications',
  'rule': 'Rules',
  'eval': 'Evaluation tools'
};

const LABELS_SINGULAR = {
  'continent': 'Continent',
  'country': 'Country',
  'sector': 'Sector',
  'tag': 'Tag',
  'org': 'Organization',
  'app': 'Application',
  'rule': 'Rule',
  'eval': 'Evaluation tool'
}

export {BASE_URL, POSSIBLE_FILTERS, LABELS_PLURAL, LABELS_SINGULAR};