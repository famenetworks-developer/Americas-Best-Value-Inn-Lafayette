import {createRoot,hydrateRoot} from 'react-dom/client';
import {App,pageFromPath} from './App';
import {AdminApp} from './AdminApp';
import './styles.css';
const root=document.getElementById('root')!;
const isAdmin=location.pathname.startsWith('/admin');
const app=isAdmin?<AdminApp/>:<App notFound={document.documentElement.dataset.page === '404'} page={pageFromPath(location.pathname)}/>;
if(isAdmin){root.replaceChildren();createRoot(root).render(app)}else if(root.querySelector('main'))hydrateRoot(root,app);else createRoot(root).render(app);
