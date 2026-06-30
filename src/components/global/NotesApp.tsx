import { useEffect, useState } from 'react';
import {
    FaGraduationCap, FaBriefcase, FaChevronLeft,
    FaCode, FaUsers, FaPalette, FaTrophy, FaFlask, FaCertificate
} from 'react-icons/fa';
import { userConfig } from '../../config/index';
import DraggableWindow from './DraggableWindow';

export type Section =
    | 'menu'
    | 'education'
    | 'experience'
    | 'skills'
    | 'roles'
    | 'activities'
    | 'competitions'
    | 'publications'
    | 'certifications';

interface NotesAppProps {
    isOpen: boolean;
    onClose: () => void;
    section?: Section; // external control of active section
}

// Type for storing image indices per item
type ImageIndicesState = Record<string, number>;

interface Image {
    url: string;
    alt?: string;
    description?: string;
}

const NotesApp = ({ isOpen, onClose, section }: NotesAppProps) => {
    const [activeSection, setActiveSection] = useState<Section>('menu');
    // Store image indices in an object: { 'itemId': index }
    const [activeImageIndices, setActiveImageIndices] = useState<ImageIndicesState>({});

    const handleSectionClick = (section: Section) => {
        setActiveSection(section);
        // No need to reset image indices globally here, 
        // they are per-item now and will default to 0 if not set
    };

    const handleBackClick = () => {
        setActiveSection('menu');
    };

    // Update image index for a specific item
    const handleNextImage = (itemId: string, images: readonly Image[]) => {
        setActiveImageIndices(prevIndices => ({
            ...prevIndices,
            [itemId]: ((prevIndices[itemId] ?? -1) + 1) % images.length
        }));
    };

    // Update image index for a specific item
    const handlePrevImage = (itemId: string, images: readonly Image[]) => {
        setActiveImageIndices(prevIndices => ({
            ...prevIndices,
            [itemId]: ((prevIndices[itemId] ?? 0) - 1 + images.length) % images.length
        }));
    };

    // Sync external section prop to internal state
    useEffect(() => {
        if (section && section !== activeSection) {
            setActiveSection(section);
        }
    }, [section]);

    if (!isOpen) return null;

    const education = userConfig.education || [];
    const experience = userConfig.experience || [];
    const skills = userConfig.skills || [];
    const roles = userConfig.extraCurricularRoles || [];
    const activities = userConfig.extraCurricularActivities || [];
    const competitions = userConfig.competitions || [];
    const publications = userConfig.publications || [];
    const certifications = userConfig.certifications || [];

    const renderBackButton = () => (
        <button
            onClick={handleBackClick}
            aria-label="Back to Notes menu"
            className="flex items-center gap-2 text-gray-300 hover:text-gray-100 mb-4"
        >
            <FaChevronLeft />
            <span>Back to Menu</span>
        </button>
    );

    // Accepts itemId to manage state correctly
    const renderImageCarousel = (itemId: string, images: readonly Image[]) => {
        const currentIndex = activeImageIndices[itemId] ?? 0;
        if (!images || images.length === 0 || currentIndex >= images.length) {
            return null;
        }

        return (
            <div className="mt-4">
                <div className="rounded-lg overflow-hidden mb-2">
                    <img
                        src={images[currentIndex].url}
                        alt={images[currentIndex].alt || 'Screenshot'}
                        decoding="async"
                        loading="lazy"
                        className="w-full h-48 object-contain bg-gray-900 rounded-lg"
                    />
                </div>

                <div className="text-sm text-gray-400 mb-3" aria-live="polite">
                    {images[currentIndex].description}
                </div>

                {images.length > 1 && (
                    <div className="flex justify-between mt-2">
                        <button
                            onClick={() => handlePrevImage(itemId, images)}
                            aria-label="Previous image"
                            className="bg-gray-700 hover:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
                        >
                            ←
                        </button>
                        <span className="text-gray-400">
                            {currentIndex + 1} / {images.length}
                        </span>
                        <button
                            onClick={() => handleNextImage(itemId, images)}
                            aria-label="Next image"
                            className="bg-gray-700 hover:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
                        >
                            →
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderInstagramEmbed = (url: string) => {
        const embedSrc = `${url.replace(/\/?$/, '/')}embed`;
        return (
            <div className="mt-4">
                <div className="mx-auto w-full max-w-[400px] rounded-xl overflow-hidden bg-black/40 border border-white/10">
                    <iframe
                        src={embedSrc}
                        title="Instagram embed"
                        loading="lazy"
                        className="w-full"
                        style={{ height: 560, border: 'none' }}
                        scrolling="no"
                        allow="encrypted-media; clipboard-write"
                        allowFullScreen
                    />
                </div>
                <div className="text-center mt-2">
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-pink-300 hover:text-pink-200 underline underline-offset-2"
                    >
                        View on Instagram →
                    </a>
                </div>
            </div>
        );
    };

    const renderEducation = () => (
        <div className="space-y-6">
            {renderBackButton()}
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Education</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {education.map((item, index) => {
                    const itemId = `education-${index}`;
                    return (
                        <div key={itemId} className="bg-gray-800/50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                            <h3 className="text-xl font-semibold text-gray-200 mb-2">{item.degree} {item.major && `- ${item.major}`}</h3>
                            <div className="text-gray-300 mb-2">{item.institution}, {item.location}</div>
                            <div className="text-gray-400 mb-3">{item.year}</div>
                            <p className="text-gray-300 mb-4">{item.description}</p>
                            {item.images && item.images.length > 0 && renderImageCarousel(itemId, item.images)}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderExperience = () => (
        <div className="space-y-6">
            {renderBackButton()}
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Professional Experience</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {experience.map((item, index) => {
                    const itemId = `experience-${index}`;
                    return (
                        <div key={itemId} className="bg-gray-800/50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                            <h3 className="text-xl font-semibold text-gray-200 mb-2">{item.title}</h3>
                            <div className="text-gray-300 mb-2">{item.company}, {item.location}</div>
                            <div className="text-gray-400 mb-3">{item.period}</div>
                            <p className="text-gray-300 mb-4">{item.description}</p>
                            {item.technologies && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {item.technologies.map((tech, i) => (
                                        <span key={i} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {item.images && item.images.length > 0 && renderImageCarousel(itemId, item.images)}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderPublications = () => (
        <div className="space-y-6">
            {renderBackButton()}
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Research & Publications</h2>
            <div className="grid grid-cols-1 gap-6">
                {publications.map((item, index) => {
                    const itemId = `publications-${index}`;
                    return (
                        <div key={itemId} className="bg-gray-800/50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                            <h3 className="text-xl font-semibold text-gray-200 mb-2">{item.title}</h3>
                            {item.authors && <div className="text-gray-300 mb-1">{item.authors}</div>}
                            <div className="text-gray-400 mb-3">{item.venue} · {item.year}</div>
                            {item.description && <p className="text-gray-300 mb-3">{item.description}</p>}
                            {item.awards && item.awards.length > 0 && (
                                <ul className="mb-3 space-y-1">
                                    {item.awards.map((award, i) => (
                                        <li key={i} className="text-amber-300 text-sm flex items-start gap-2">
                                            <FaTrophy className="mt-0.5 shrink-0" /> <span>{award}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="flex flex-wrap items-center gap-3">
                                {item.doi && <span className="text-xs text-gray-400">DOI: {item.doi}</span>}
                                {item.url && (
                                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                                        className="text-xs px-2 py-1 rounded bg-violet-600/40 hover:bg-violet-600/60 text-violet-100 transition-colors">
                                        View paper →
                                    </a>
                                )}
                            </div>
                            {item.images && item.images.length > 0 && renderImageCarousel(itemId, item.images)}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderCertifications = () => {
        const grouped = certifications.reduce<Record<string, typeof certifications[number][]>>((acc, cert) => {
            const key = cert.category || 'Other';
            (acc[key] = acc[key] || []).push(cert);
            return acc;
        }, {});
        return (
            <div className="space-y-6">
                {renderBackButton()}
                <h2 className="text-2xl font-bold text-gray-200 mb-6">Certifications</h2>
                {Object.entries(grouped).map(([category, certs]) => (
                    <div key={category}>
                        <h3 className="text-sm uppercase tracking-wide text-gray-400 mb-3">{category}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            {certs.map((cert, index) => (
                                <div key={`${category}-${index}`} className="bg-gray-800/50 p-4 rounded-xl shadow-lg flex items-start gap-3">
                                    <div className="w-9 h-9 bg-cyan-600/30 rounded-lg flex items-center justify-center shrink-0">
                                        <FaCertificate className="text-cyan-300" />
                                    </div>
                                    <div>
                                        <div className="text-gray-200 font-medium leading-snug">{cert.title}</div>
                                        <div className="text-gray-400 text-sm">{cert.issuer}{cert.year ? ` · ${cert.year}` : ''}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderSkills = () => {
        const EXPERT = new Set([
            'Python', 'TypeScript', 'JavaScript', 'React.js', 'Node.js', 'SQL',
            'Git', 'LLMs', 'RAG', 'Prompt Engineering',
        ]);
        const ADVANCED = new Set([
            'Next.js', 'FastAPI', 'Express.js', 'PostgreSQL', 'MongoDB', 'Docker',
            'Machine Learning', 'Deep Learning', 'React Native', 'OCR',
            'Named Entity Recognition', 'CI/CD', 'Computer Vision', 'Firebase',
        ]);
        // Everything else → Intermediate

        const getTier = (skill: string): 'Expert' | 'Advanced' | 'Intermediate' => {
            if (EXPERT.has(skill)) return 'Expert';
            if (ADVANCED.has(skill)) return 'Advanced';
            return 'Intermediate';
        };

        const tierStyle: Record<string, string> = {
            Expert: 'bg-green-600/70 hover:bg-green-500/80',
            Advanced: 'bg-blue-600/50 hover:bg-blue-500/70',
            Intermediate: 'bg-gray-700/80 hover:bg-gray-600/80',
        };
        const tierLabel: Record<string, string> = {
            Expert: '★★★',
            Advanced: '★★',
            Intermediate: '★',
        };

        const grouped: Record<string, string[]> = {
            Expert: skills.filter((s) => getTier(s) === 'Expert'),
            Advanced: skills.filter((s) => getTier(s) === 'Advanced'),
            Intermediate: skills.filter((s) => getTier(s) === 'Intermediate'),
        };

        return (
            <div className="space-y-6">
                {renderBackButton()}
                <h2 className="text-2xl font-bold text-gray-200 mb-2">Skills</h2>
                <p className="text-sm text-gray-400 mb-4">★★★ Expert · ★★ Advanced · ★ Intermediate</p>
                {(['Expert', 'Advanced', 'Intermediate'] as const).map((tier) => (
                    <div key={tier} className="bg-gray-800/50 p-4 rounded-xl shadow-lg">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{tier}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {grouped[tier].map((skill, index) => (
                                <div
                                    key={index}
                                    className={`px-3 py-2 rounded-lg text-sm text-gray-100 flex items-center justify-between transition-colors ${tierStyle[tier]}`}
                                >
                                    <span className="font-medium truncate">{skill}</span>
                                    <span className="ml-2 text-[10px] text-gray-200/50 shrink-0">{tierLabel[tier]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderExtraCurricularRoles = () => (
        <div className="space-y-6">
            {renderBackButton()}
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Extracurricular Roles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {roles.map((item, index) => {
                    const itemId = `roles-${index}`;
                    return (
                        <div key={itemId} className="bg-gray-800/50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                            <h3 className="text-xl font-semibold text-gray-200 mb-2">{item.role}</h3>
                            <div className="text-gray-300 mb-2">{item.institution}, {item.location}</div>
                            <div className="text-gray-400 mb-3">{item.year}</div>
                            {item.images && item.images.length > 0 && renderImageCarousel(itemId, item.images)}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderExtraCurricularActivities = () => (
        <div className="space-y-6">
            {renderBackButton()}
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Extracurricular Activities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activities.map((item, index) => {
                    const itemId = `activities-${index}`;
                    return (
                        <div key={itemId} className="bg-gray-800/50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                            <h3 className="text-xl font-semibold text-gray-200 mb-2">{item.title}</h3>
                            <div className="text-gray-300 mb-2">{item.institution}, {item.location}</div>
                            <div className="text-gray-400 mb-3">{item.year}</div>
                            {item.description && <p className="text-gray-300 mb-4">{item.description}</p>}
                            {item.instagramUrl && renderInstagramEmbed(item.instagramUrl)}
                            {item.images && item.images.length > 0 && renderImageCarousel(itemId, item.images)}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderCompetitions = () => (
        <div className="space-y-6">
            {renderBackButton()}
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Competitions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {competitions.map((item, index) => {
                    const itemId = `competitions-${index}`;
                    return (
                        <div key={itemId} data-tour-id={index === 0 ? 'notes-competitions-card' : undefined} className="bg-gray-800/50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                            <h3 className="text-xl font-semibold text-gray-200 mb-2">{item.title}</h3>
                            <div className="text-gray-300 mb-2">{item.description}</div>
                            <div className="text-gray-400 mb-3">Achievement: {item.achievement} ({item.year})</div>
                            {item.images && item.images.length > 0 && renderImageCarousel(itemId, item.images)}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderMenu = () => (
        <div>
            <h2 className="text-2xl font-bold text-gray-200 mb-6">My Notes</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Competitions */}
                <button
                    type="button"
                    className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-700/50 transition-colors text-left"
                    onClick={() => handleSectionClick('competitions')}
                    aria-label="Open Competitions section"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                            <FaTrophy size={28} className="text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-200">Competitions</h3>
                    </div>
                    <p className="text-gray-400">View my competition history and achievements</p>
                </button>

                {/* Education */}
                <button
                    type="button"
                    className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-700/50 transition-colors text-left"
                    onClick={() => handleSectionClick('education')}
                    aria-label="Open Education section"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                            <FaGraduationCap size={28} className="text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-200">Education</h3>
                    </div>
                    <p className="text-gray-400">View my educational background and qualifications</p>
                </button>

                {/* Experience */}
                <button
                    type="button"
                    className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-700/50 transition-colors text-left"
                    onClick={() => handleSectionClick('experience')}
                    aria-label="Open Professional Experience section"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                            <FaBriefcase size={28} className="text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-200">Professional Experience</h3>
                    </div>
                    <p className="text-gray-400">Explore my professional work experience</p>
                </button>
                {/* Extracurricular Roles */}
                <button
                    type="button"
                    className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-700/50 transition-colors text-left"
                    onClick={() => handleSectionClick('roles')}
                    aria-label="Open Extracurricular Roles section"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                            <FaUsers size={28} className="text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-200">Extracurricular Roles</h3>
                    </div>
                    <p className="text-gray-400">My involvement in student activities and roles</p>
                </button>

                {/* Extracurricular Activities */}
                <button
                    type="button"
                    className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-700/50 transition-colors text-left"
                    onClick={() => handleSectionClick('activities')}
                    aria-label="Open Extracurricular Activities section"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-pink-600 rounded-xl flex items-center justify-center">
                            <FaPalette size={28} className="text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-200">Extracurricular Activities</h3>
                    </div>
                    <p className="text-gray-400">My participation in events and activities</p>
                </button>
                {/* Research & Publications */}
                <button
                    type="button"
                    className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-700/50 transition-colors text-left"
                    onClick={() => handleSectionClick('publications')}
                    aria-label="Open Research and Publications section"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center">
                            <FaFlask size={28} className="text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-200">Research & Publications</h3>
                    </div>
                    <p className="text-gray-400">My papers, preprints, and research awards</p>
                </button>

                {/* Certifications */}
                <button
                    type="button"
                    className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-700/50 transition-colors text-left"
                    onClick={() => handleSectionClick('certifications')}
                    aria-label="Open Certifications section"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center">
                            <FaCertificate size={28} className="text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-200">Certifications</h3>
                    </div>
                    <p className="text-gray-400">Professional certifications and coursework</p>
                </button>

                {/* Skills */}
                <button
                    type="button"
                    className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-700/50 transition-colors text-left"
                    onClick={() => handleSectionClick('skills')}
                    aria-label="Open Skills section"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                            <FaCode size={28} className="text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-200">Skills</h3>
                    </div>
                    <p className="text-gray-400">See my technical skills and expertise</p>
                </button>
            </div>
        </div>
    );

    const getWindowTitle = () => {
        switch (activeSection) {
            case 'menu': return 'Notes';
            case 'education': return 'Education Notes';
            case 'experience': return 'Experience Notes';
            case 'publications': return 'Research & Publications Notes';
            case 'certifications': return 'Certifications Notes';
            case 'skills': return 'Skills Notes';
            case 'roles': return 'Extracurricular Roles Notes';
            case 'activities': return 'Extracurricular Activities Notes';
            case 'competitions': return 'Competitions Notes';
            default: return 'Notes';
        }
    };

    return (
        <DraggableWindow
            title={getWindowTitle()}
            onClose={onClose}
            initialPosition={{ 
                x: Math.floor(window.innerWidth * 0.3), 
                y: Math.floor(window.innerHeight * 0.2) 
            }}
            className="w-[93vw] md:max-w-4xl max-h-[90vh] flex flex-col"
            initialSize={{ width: 700, height: 600 }}
        >
            <div className="flex flex-col flex-grow min-h-0 h-full">
                <div className="overflow-y-auto no-scrollbar flex-grow min-h-0 p-4 md:p-6">
                    {activeSection === 'menu' && renderMenu()}
                    {activeSection === 'education' && renderEducation()}
                    {activeSection === 'experience' && renderExperience()}
                    {activeSection === 'publications' && renderPublications()}
                    {activeSection === 'certifications' && renderCertifications()}
                    {activeSection === 'skills' && renderSkills()}
                    {activeSection === 'roles' && renderExtraCurricularRoles()}
                    {activeSection === 'activities' && renderExtraCurricularActivities()}
                    {activeSection === 'competitions' && renderCompetitions()}
                </div>
            </div>
        </DraggableWindow>
    );
};

export default NotesApp; 