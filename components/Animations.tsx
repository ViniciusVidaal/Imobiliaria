"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function Animations() {
  useEffect(() => {
    window.gsap = window.gsap || gsap;
    if (!window.gsap) return;
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: "power3.out", duration: 0.9 });
    gsap.from(".site-header", { y: -30, opacity: 0, delay: 0.2 });
    gsap.from(".hero-copy > *", { y: 46, opacity: 0, stagger: 0.12, delay: 0.35 });
    gsap.to(".scroll-progress", { scaleX: 1, ease: "none", scrollTrigger: { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 0.2 } });
    gsap.to(".site-header", { paddingTop: 8, paddingBottom: 8, boxShadow: "0 15px 50px rgba(0,0,0,.16)", scrollTrigger: { trigger: document.documentElement, start: "100 top", end: "260 top", scrub: 0.35 } });
    gsap.to(".hero-copy", { yPercent: -15, opacity: 0.45, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.7 } });
    gsap.to(".hero-visual", { yPercent: 12, scale: 0.94, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.7 } });
    gsap.utils.toArray<HTMLElement>(".section-head").forEach((head) => gsap.from(head.children, { y: 54, opacity: 0, filter: "blur(8px)", stagger: 0.1, scrollTrigger: { trigger: head, start: "top 78%", once: true } }));
    gsap.utils.toArray<HTMLElement>(".property-card,.metric,.service-card,.agent-card,.testimonial-stage").forEach((element, index) => gsap.from(element, { y: 70, opacity: 0, scale: 0.94, rotateX: 8, delay: (index % 4) * 0.05, scrollTrigger: { trigger: element, start: "top 84%", once: true } }));
    gsap.utils.toArray<HTMLElement>(".split").forEach((row) => gsap.from(row.children, { x: (index) => index === 0 ? -70 : 70, opacity: 0, filter: "blur(7px)", stagger: 0.16, scrollTrigger: { trigger: row, start: "top 78%", once: true } }));
    gsap.utils.toArray<HTMLElement>(".btn,.fab").forEach((button) => {
      button.addEventListener("mouseenter", () => gsap.to(button, { scale: 1.06, duration: 0.22 }));
      button.addEventListener("mouseleave", () => gsap.to(button, { scale: 1, duration: 0.22 }));
    });
    ScrollTrigger.refresh();
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    return () => { window.removeEventListener("load", refresh); ScrollTrigger.getAll().forEach((trigger) => trigger.kill()); };
  }, []);
  return null;
}
