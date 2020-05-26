import { environment } from '../environments/environment';

const BASE_URL = environment.production ? '/' : 'http://localhost:3443/' ;

const POSSIBLE_FILTERS = ['continentIds', 'countryIds', 'sectorIds', 'orgIds', 'tagIds', 'appIds', 'evalIds', 'ruleIds', 'filter', 'p'];

const TITLES = {
    'continent': 'Continents',
    'country': 'Countries',
    'sector': 'Sectors',
    'tag': 'Tags',
    'org': 'Organizations',
    'app': 'Applications',
    'rule': 'Rules',
    'eval': 'Evaluation tools'
};

export {BASE_URL, POSSIBLE_FILTERS, TITLES};