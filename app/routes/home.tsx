import type { Route } from "./+types/home";
import Navbar from "../../components/Navbar";
import {ArrowRight, ArrowUpRight, Clock, Layers} from "lucide-react";
import Button from "../../components/ui/Button";
import Upload from "../../components/Upload";
import {useNavigate} from "react-router";
import {useState, useEffect} from "react";
import {createProject} from "../../lib/puter.action";
import puter from "@heyputer/puter.js";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<DesignItem[]>([]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await puter.kv.get('projects');
                if (data) {
                    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                    if (Array.isArray(parsed)) {
                        setProjects(parsed);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch projects", e);
            }
        };
        fetchProjects();
    }, []);

    const handleUploadComplete = async (data: string | { error: string }) => {
        if (typeof data === 'object' && 'error' in data) {
            alert(data.error);
            return false;
        }
        const newId = Date.now().toString();
        const name = `Residence_${newId}`;

        const newItem  = {
            id: newId, name, sourceImage: data,
            renderedImage: undefined,
            timestamp: Date.now()
        }

        const saved = await createProject({item: newItem, visibility: 'private'})

        if(!saved){
            console.error("Failed to create project");
            return false;
        }

        setProjects((prev) => [saved, ...prev]);

        navigate(`/visualizer/${newId}`,
            {
                state: {
                    initialImage: saved.sourceImage,
                    initialRendered: saved.renderedImage || null,
                    name
                }
            }
            );



        return true;
    }

  return (
      <div className="home">
        <Navbar/>
          <section className="hero">
              <div className="announce">
                  <div className="dot">
                      <div className="pulse"></div>
                  </div>

                  <p>Introducing Kompascale 2.0</p>
              </div>
              <h1>
                  Sketch it. Scale it. From blueprint to reality with Kompascale
              </h1>

              <p className="subtitle">
                  Kompascale is the AI-powered design engine built for modern architects. Streamline your workflow ,Visualize, render, and export professional projects at 10x speed.
              </p>

              <div className="actions">
                  <a href="#upload" className="cta">
                      Start Building <ArrowRight className="icon"/>
                  </a>

                  <Button variant="outline" size="lg" className="demo">
                      See in Real Time
                  </Button>
              </div>
              <div id="upload" className="upload-shell">
                  <div className="grid-overlay"/>
              <div className="upload-card">
                  <div className="upload-head">
                      <div className="upload-icon">
                          <Layers className="icon"/>
                      </div>

                      <h3>Upload your floor plan</h3>
                      <p>Supports JPG, PNG formats up to 10 MB</p>
                  </div>
                  <Upload onComplete={handleUploadComplete}/>
              </div>
              </div>
          </section>

          <section className="projects">
              <div className="section-inner">
                  <div className="section-head">
                      <div className="copy">
                          <h2>Projects</h2>
                          <p>Your latest work and shared community projects, all in one place.</p>
                      </div>
                  </div>

                  <div className="projects-grid">
                      {projects.map(({id, name, renderedImage, sourceImage, timestamp}) => (
                          <div key={id} className="project-card group">
                          <div className="preview">
                              <img src={renderedImage || sourceImage} alt="project"/>
                              <div className="badge">
                                  <span>Community</span>
                              </div>
                          </div>

                          <div className="card-body">
                              <div>
                                  <h3>{name}</h3>

                                  <div className="meta">
                                      <Clock size={12} />
                                      <span>{new Date(timestamp).toLocaleDateString()}</span>
                                      <span>By Morseta</span>
                                  </div>
                              </div>

                              <div className="arrow">
                                  <ArrowUpRight size={15}/>
                              </div>
                          </div>
                      </div>
                          ))}
                  </div>
              </div>
          </section>
      </div>
  )
}
