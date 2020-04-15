import { environment } from '../environments/environment';

const BASE_URL = environment.production ? '/' : 'http://localhost:3000/' ;

export {BASE_URL};