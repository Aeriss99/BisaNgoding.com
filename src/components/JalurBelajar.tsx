import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Lock, ChevronRight } from 'lucide-react';
import roadmapDataRaw from '../../content/roadmap.json';
import type { Roadmap } from '../types/schema';
import { modulesData, getVisibleLessons, checkModuleUnlocked } from '../lib/content';
import { useProgress } from '../context/ProgressContext';

const roadmapData = roadmapDataRaw as Roadmap;

interface JalurBelajarProps {
  tampilkanProgres: boolean;
  onMulai?: () => void;
}

export const JalurBelajarComponent: React.FC<JalurBelajarProps> = ({ tampilkanProgres, onMulai }) => {
  const { progress } = useProgress();
  const [activeJalurId, setActiveJalurId] = useState<string>(roadmapData.jalur[0].id);

  useEffect(() => {
    try {
      const lastCourse = localStorage.getItem('lastCourse');
      if (lastCourse) {
        const foundJalur = roadmapData.jalur.find(j => 
          j.langkah.some(l => l.kelas === lastCourse)
        );
        if (foundJalur) {
          setActiveJalurId(foundJalur.id);
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  const activeJalur = roadmapData.jalur.find(j => j.id === activeJalurId) || roadmapData.jalur[0];

  // Helper function to calculate step status
  const getLangkahInfo = (langkah: any) => {
    if (langkah.segera) {
      return { status: 'segera', completedModules: 0, totalModules: 0, firstUnfinishedModuleId: null, firstUnfinishedCourseId: null };
    }

    if (!langkah.modul || langkah.modul.length === 0) {
      return { status: 'segera', completedModules: 0, totalModules: 0, firstUnfinishedModuleId: null, firstUnfinishedCourseId: null };
    }

    let allReadyModulesCount = 0;
    let completedReadyModulesCount = 0;
    let firstUnfinishedModuleId = null;
    let firstUnfinishedCourseId = langkah.kelas || null;

    for (const modId of langkah.modul) {
      const mod = modulesData.find(m => m.id === modId);
      if (mod && mod.status === 'ready') {
        allReadyModulesCount++;
        const totalLessonsInMod = getVisibleLessons(mod.id).length;
        const completedLessonsInMod = getVisibleLessons(mod.id).filter(l => progress.completedLessons.includes(l.id)).length;
        
        if (totalLessonsInMod > 0 && completedLessonsInMod === totalLessonsInMod) {
          completedReadyModulesCount++;
        } else if (!firstUnfinishedModuleId) {
          firstUnfinishedModuleId = mod.id;
        }
      }
    }

    if (allReadyModulesCount === 0) {
      return { status: 'segera', completedModules: 0, totalModules: 0, firstUnfinishedModuleId: null, firstUnfinishedCourseId };
    }

    if (completedReadyModulesCount === allReadyModulesCount) {
      return { status: 'selesai', completedModules: completedReadyModulesCount, totalModules: allReadyModulesCount, firstUnfinishedModuleId: null, firstUnfinishedCourseId };
    }

    return { status: 'belum', completedModules: completedReadyModulesCount, totalModules: allReadyModulesCount, firstUnfinishedModuleId, firstUnfinishedCourseId };
  };

  const langkahInfos = activeJalur.langkah.map((l) => getLangkahInfo(l));
  
  let currentStepIndex = -1;
  if (tampilkanProgres) {
    currentStepIndex = langkahInfos.findIndex(info => info.status === 'belum');
  }

  return (
    <div className="w-full">
      <div className="flex bg-bg-surface border-2 border-text-main font-space shadow-[2px_2px_0px_var(--color-text-main)] mb-6 p-1 overflow-x-auto whitespace-nowrap">
        {roadmapData.jalur.map(j => (
          <button
            key={j.id}
            onClick={() => setActiveJalurId(j.id)}
            aria-pressed={activeJalurId === j.id}
            className={`flex-1 px-4 py-2 font-bold transition-colors ${
              activeJalurId === j.id
                ? 'bg-primary text-text-main border-2 border-text-main'
                : 'text-text-muted hover:text-text-main border-2 border-transparent'
            }`}
          >
            {j.judul}
          </button>
        ))}
      </div>

      <div className="mb-8">
        <p className="text-text-main leading-relaxed">{activeJalur.deskripsi}</p>
      </div>

      <div className="relative border-l-2 border-text-muted/30 ml-4 pl-6 md:ml-6 md:pl-8 space-y-8 mb-8">
        {activeJalur.langkah.map((langkah, index) => {
          const info = langkahInfos[index];
          const isCurrent = tampilkanProgres && currentStepIndex === index;
          const isDone = tampilkanProgres && info.status === 'selesai';
          const isSegera = info.status === 'segera';

          let icon;
          let circleClass = "w-6 h-6 rounded-full border-2 border-text-main absolute -left-[13px] md:-left-[15px] top-1 bg-bg-main";
          
          if (isSegera) {
             circleClass = "w-6 h-6 rounded-full border-2 border-text-muted absolute -left-[13px] md:-left-[15px] top-1 bg-bg-subtle";
          } else if (isDone) {
            circleClass = "w-6 h-6 rounded-full border-2 border-text-main absolute -left-[13px] md:-left-[15px] top-1 bg-[#10b981] flex items-center justify-center";
            icon = <Check className="w-4 h-4 text-bg-main" />;
          } else if (isCurrent) {
            circleClass = "w-6 h-6 rounded-full border-2 border-text-main absolute -left-[13px] md:-left-[15px] top-1 bg-primary";
          }

          const cardClass = `relative bg-bg-surface border-2 border-text-main p-4 md:p-5 ${
            isCurrent ? 'shadow-[4px_4px_0px_var(--color-primary)]' : 'shadow-[2px_2px_0px_var(--color-text-main)]'
          } ${isSegera ? 'opacity-80' : ''}`;

          return (
            <div key={index} className="relative">
              <div className={circleClass}>{icon}</div>
              
              <div className={cardClass}>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-space text-xs font-bold text-text-muted uppercase tracking-wider">
                    Langkah {index + 1}
                  </span>
                  {isSegera && (
                    <span className="bg-bg-subtle text-text-muted text-xs font-bold px-2 py-1 border border-text-muted">
                      Segera hadir
                    </span>
                  )}
                </div>
                
                <h3 className="font-space font-bold text-lg mb-2">{langkah.judul}</h3>
                <p className="text-text-muted text-sm mb-4">{langkah.deskripsi}</p>
                
                {!isSegera && langkah.modul && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {langkah.modul.map(modId => {
                      const mod = modulesData.find(m => m.id === modId);
                      if (!mod) return null;
                      
                      const isDraft = mod.status !== 'ready';
                      const unlocked = tampilkanProgres && mod.status === 'ready' && checkModuleUnlocked(mod, progress);
                      const modLessons = getVisibleLessons(mod.id);
                      const modCompletedLessons = modLessons.filter(l => progress.completedLessons.includes(l.id)).length;
                      const modFinished = tampilkanProgres && modLessons.length > 0 && modCompletedLessons === modLessons.length;
                      
                      let content = (
                        <span className="flex items-center text-xs font-bold px-2 py-1">
                          {mod.title}
                          {isDraft && <span className="ml-1 opacity-70">(segera)</span>}
                        </span>
                      );

                      if (tampilkanProgres && mod.status === 'ready') {
                        if (unlocked) {
                          content = (
                            <Link to={`/module/${mod.id}`} className="flex items-center text-xs font-bold px-2 py-1 hover:underline">
                              {mod.title}
                              {modFinished && <Check className="w-3 h-3 ml-1 text-[#10b981]" />}
                            </Link>
                          );
                        } else {
                          content = (
                            <span className="flex items-center text-xs font-bold px-2 py-1 opacity-70">
                              <Lock className="w-3 h-3 mr-1" />
                              {mod.title}
                            </span>
                          );
                        }
                      }

                      return (
                        <div key={modId} className={`border border-text-main bg-bg-main ${modFinished ? 'border-[#10b981] bg-[#10b981]/10' : ''}`}>
                          {content}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {tampilkanProgres && !isSegera && info.totalModules > 0 && (
                  <div className="mt-4 pt-4 border-t border-text-muted/30">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Progres</span>
                      <span>{info.completedModules}/{info.totalModules} modul siap</span>
                    </div>
                    <div className="h-1.5 bg-bg-main border border-text-main w-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${(info.completedModules / info.totalModules) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {isCurrent && info.firstUnfinishedModuleId && (
                  <div className="mt-4">
                    {checkModuleUnlocked(modulesData.find(m => m.id === info.firstUnfinishedModuleId)!, progress) ? (
                      <Link 
                        to={`/module/${info.firstUnfinishedModuleId}`}
                        className="inline-flex items-center justify-center font-space font-bold bg-primary text-text-main border-2 border-text-main px-4 py-2 hover:bg-primary-hover shadow-[2px_2px_0px_var(--color-text-main)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all text-sm w-full md:w-auto"
                      >
                        Lanjutkan Belajar
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    ) : (
                      <Link 
                        to={`/course/${info.firstUnfinishedCourseId}`}
                        className="inline-flex items-center justify-center font-space font-bold bg-primary text-text-main border-2 border-text-main px-4 py-2 hover:bg-primary-hover shadow-[2px_2px_0px_var(--color-text-main)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all text-sm w-full md:w-auto"
                      >
                        Lanjutkan Belajar
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {!tampilkanProgres && onMulai && (
        <div className="flex justify-center mb-8">
          <button 
            onClick={onMulai}
            className="font-space font-bold bg-primary text-text-main border-2 border-text-main px-8 py-3 text-lg hover:bg-primary-hover shadow-[4px_4px_0px_var(--color-text-main)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
          >
            Mulai Belajar Gratis
          </button>
        </div>
      )}

      {roadmapData.pendamping && (
        <div className="bg-bg-surface border-2 border-text-main shadow-[2px_2px_0px_var(--color-text-main)] p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-space font-bold text-md">{roadmapData.pendamping.judul}</h3>
          </div>
          <p className="text-text-muted text-sm mb-3">{roadmapData.pendamping.deskripsi}</p>
          <Link 
            to={`/course/${roadmapData.pendamping.kelas}`}
            className="inline-flex items-center font-bold text-sm hover:underline"
          >
            Lihat Kelas
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default JalurBelajarComponent;