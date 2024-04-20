import { get_captions } from "./captions";
import { get_comments } from "./comments";
import { analyze_video } from "./gemini";
import { getThumbnailUrl } from "./thumbnails";
import VideoData from "./video_data";

function injectButtons() {
  const videoContainers = document.querySelectorAll("#details");

  videoContainers.forEach((container) => {
    if (!container.querySelector(".clickbait-detector-button")) {
      const titleElement = container.querySelector("#video-title");

      if (titleElement) {
        const button = document.createElement("button");
        button.innerText = "Detect Clickbait";
        button.classList.add("clickbait-detector-button");
        button.style.marginRight = "3px";
        button.style.padding = "8.9673px";
        button.style.border = "none";
        // dark background and light text
        button.style.background = "#295fc0";
        button.style.color = "#FFFFFF";
        button.style.cursor = "pointer";
        button.style.fontSize = "1.2rem";
        button.style.fontWeight = "bold";
        button.style.borderRadius = "8px";
        titleElement.parentNode!.insertBefore(button, titleElement.nextSibling);

        button.addEventListener("click", (e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          const video_id = ((e.target as HTMLElement).parentNode as HTMLAnchorElement).href.replace("https://www.youtube.com/watch?v=","");
          const title = (e.target as HTMLElement).parentNode!.children[0].innerHTML;
          const metadata = (e.target as HTMLElement).parentNode!.parentNode!.parentNode!.children[1].children[0];
          const author = metadata.children[0].children[0].children[0].children[0].children[0].children[0].textContent!;
          const popup = document.createElement("div");
          popup.classList.add("yt_analyzer_popup");
          popup.style.left = e.pageX+"px";
          popup.style.top = e.pageY+"px";
          popup.style.background = "#222222";
          popup.style.color = "#FFFFFF";
          popup.style.fontSize = "1.8rem";
          popup.style.zIndex = "4000";
          popup.textContent = "Getting captions for "+video_id;
          document.body.appendChild(popup);
          get_captions(video_id).then(async captions => {
            popup.textContent = "Analyzing captions for " + video_id;
            if(captions.length > 0) {
              popup.textContent += ". Captions found.";
              // Continue with analysis
            }
            else {
              popup.textContent += ". No captions found.";
              // Do analysis without captions
            }
            const video_data: VideoData = {
              thumbnail: await getThumbnailUrl(video_id,0),
              captions: captions,
              title: title,
              author: author,
              view_count: Number(metadata.children[1].children[2].textContent!.split(" view")[0].replace("K","000").replace(","," ").replace("M","000000").replace("B","000000000")),
              top_comments: await get_comments(video_id),
              publish_date: new Date(),
              likes: 0,
              description: "",
            };
            console.log(video_data);
            const analysis = await analyze_video(video_data);
            const out = document.createElement("div");
            out.classList.add("analysis");
            // Numerics data
            for(let index in analysis.numerics) {
              const item = document.createElement("div");
              item.classList.add("numerics_item");
              const bar = document.createElement("div");
              bar.innerText = index[0].toUpperCase() + index.substring(1);
              const bar_num = document.createElement("span");
              bar_num.classList.add("numerics_bar_number");
              bar_num.innerText = (analysis.numerics as any)[index];
              bar.classList.add("numerics_bar");
              bar.appendChild(bar_num);
              const bar_inner = document.createElement("div");
              bar_inner.classList.add("numerics_bar_inner");
              bar_inner.style.width = ((analysis.numerics as any)[index] * 20).toString() + "%";
              bar.appendChild(bar_inner);
              item.appendChild(bar);
              out.appendChild(item);
            }
            let text_items = [
              ["Suggested title",analysis.sentences.suggested_title],
              ["Summary",analysis.sentences.summary],
              ["Style",analysis.categories.style],
              ["Topics covered", analysis.sentences.topics_covered],
              ["Topic phrase",analysis.sentences.topic_phrase],
              ["Subject", analysis.categories.subject_matter]
            ];
            for(let item of text_items) {
              const el = document.createElement("div");
              el.classList.add("sentences_container");
              const label = document.createElement("span");
              label.innerText = item[0] + ": ";
              label.classList.add("sentences_label");
              const text = document.createElement("span");
              text.innerText = item[1];
              text.classList.add("sentences_content");
              el.appendChild(label);
              el.appendChild(text);
              out.appendChild(el);
            }
            popup.textContent = "";
            popup.appendChild(out);
          })
        });
      }
    }
  });
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      injectButtons();
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

injectButtons();
