import { environment } from '../environments/environment';

const BASE_URL = environment.production ? '/' : 'http://localhost:3443/' ;
//const BASE_URL = 'http://localhost:3443/' ;

const SERVER_NAME = 'proto';

const POSSIBLE_FILTERS = ['continentIds', 'countryIds', 'sectorIds', 'orgIds', 'tagIds', 'appIds', 'evalIds', 'scIds', 'typeIds', 'ruleIds', 'filter', 'p'];

const LABELS_PLURAL = {
  'continent': 'Continents',
  'country': 'Countries',
  'sector': 'Sectors',
  'tag': 'Tags',
  'org': 'Organizations',
  'app': 'Applications/Websites',
  'eval': 'Evaluation tools',
  'sc': 'Success Criteria',
  'type': 'Types of element',
  'rule': 'Rules'
};

const LABELS_SINGULAR = {
  'continent': 'Continent',
  'country': 'Country',
  'sector': 'Sector',
  'tag': 'Tag',
  'org': 'Organization',
  'app': 'Application/Website',
  'eval': 'Evaluation tool',
  'sc': 'Success Criteria',
  'type': 'Type of element',
  'rule': 'Rule'
}

const SECTORS = {
  0: 'Public',
  1: 'Private'
}

const TYPES = {
  0: 'Website',
  1: 'Application'
}

const GENERATORS = [
  {
    name: 'Portuguese Generator Tool',
    value: 'govpt'
  },
  {
    name: 'W3 Generator Tool',
    value: 'w3'
  }
];

const FILEINPUT_LABEL = 'Choose file(s)';

export {BASE_URL, POSSIBLE_FILTERS, LABELS_PLURAL, LABELS_SINGULAR, SECTORS, TYPES, SERVER_NAME, FILEINPUT_LABEL, GENERATORS};