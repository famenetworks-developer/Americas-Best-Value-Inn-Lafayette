import {createRoot,hydrateRoot} from 'react-dom/client';
import {App,pageFromPath} from './App';
import './styles.css';
const root=document.getElementById('root')!;
const app=<App notFound={document.documentElement.dataset.page === '404'} page={pageFromPath(location.pathname)}/>;
if(root.querySelector('main'))hydrateRoot(root,app);else createRoot(root).render(app);
