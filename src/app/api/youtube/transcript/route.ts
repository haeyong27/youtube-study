import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId가 필요합니다." },
        { status: 400 }
      );
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const tempDir = `/tmp/yt-dlp-${Date.now()}`;

    try {
      // 임시 디렉토리 생성
      await execAsync(`mkdir -p ${tempDir}`);

      // yt-dlp를 사용하여 자막 파일 다운로드 (더 간단한 명령어 사용)
      const command = `cd ${tempDir} && yt-dlp --write-auto-sub --sub-langs "ko,en" --skip-download --output "%(id)s" "${videoUrl}"`;

      console.log(`실행 명령어: ${command}`);

      const { stdout, stderr } = await execAsync(command, {
        timeout: 45000, // 45초 타임아웃
      });

      console.log("yt-dlp stdout:", stdout);
      if (stderr) {
        console.log("yt-dlp stderr:", stderr);
      }

      // 다운로드된 파일 목록 확인
      const { stdout: fileList } = await execAsync(`ls -la ${tempDir}`);
      console.log("다운로드된 파일들:", fileList);

      // 자막 파일 찾기 및 읽기
      let transcript = "";
      const subtitleFiles = await findSubtitleFiles(tempDir, videoId);

      if (subtitleFiles.length === 0) {
        return NextResponse.json(
          { error: "이 영상에는 사용 가능한 자막이 없습니다." },
          { status: 404 }
        );
      }

      // 우선순위: 한국어 > 영어 > 기타
      const preferredFile =
        subtitleFiles.find((file) => file.includes(".ko.")) ||
        subtitleFiles.find((file) => file.includes(".en.")) ||
        subtitleFiles[0];

      if (preferredFile) {
        try {
          const content = await fs.readFile(preferredFile, "utf-8");
          transcript = content;
          console.log(`자막 파일 읽기 성공: ${preferredFile}`);
        } catch (readError) {
          console.error("파일 읽기 오류:", readError);
        }
      }

      // 임시 디렉토리 정리
      await execAsync(`rm -rf ${tempDir}`).catch(() => {});

      if (!transcript || transcript.trim() === "") {
        return NextResponse.json(
          { error: "자막 파일을 읽을 수 없습니다." },
          { status: 500 }
        );
      }

      // 자막 텍스트 정리
      const cleanedTranscript = cleanSubtitleText(transcript);

      if (!cleanedTranscript || cleanedTranscript.trim() === "") {
        return NextResponse.json(
          { error: "자막 내용이 비어있습니다." },
          { status: 404 }
        );
      }

      return NextResponse.json({ transcript: cleanedTranscript });
    } catch (execError: any) {
      console.error("yt-dlp 실행 오류:", execError);

      // 임시 디렉토리 정리
      await execAsync(`rm -rf ${tempDir}`).catch(() => {});

      if (execError.code === "ENOENT") {
        return NextResponse.json(
          {
            error:
              "yt-dlp가 설치되지 않았습니다. 시스템 관리자에게 문의하세요.",
          },
          { status: 500 }
        );
      }

      if (execError.signal === "SIGTERM") {
        return NextResponse.json(
          { error: "스크립트 추출 시간이 초과되었습니다. 다시 시도해주세요." },
          { status: 408 }
        );
      }

      // stderr에서 더 구체적인 오류 메시지 추출
      const errorMessage = extractErrorMessage(
        execError.stderr || execError.message
      );

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.error("스크립트 가져오기 오류:", error);
    return NextResponse.json(
      { error: "스크립트를 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// 자막 파일 찾기 함수
async function findSubtitleFiles(
  tempDir: string,
  videoId: string
): Promise<string[]> {
  try {
    const files = await fs.readdir(tempDir);
    const subtitleFiles = files
      .filter(
        (file) =>
          file.includes(videoId) &&
          (file.endsWith(".vtt") || file.endsWith(".srt"))
      )
      .map((file) => path.join(tempDir, file));

    console.log("찾은 자막 파일들:", subtitleFiles);
    return subtitleFiles;
  } catch (error) {
    console.error("파일 목록 읽기 오류:", error);
    return [];
  }
}

// 오류 메시지 추출 함수
function extractErrorMessage(stderr: string): string {
  if (stderr.includes("Private video")) {
    return "비공개 영상입니다. 자막을 가져올 수 없습니다.";
  }
  if (stderr.includes("Video unavailable")) {
    return "영상을 사용할 수 없습니다.";
  }
  if (stderr.includes("No subtitles")) {
    return "이 영상에는 자막이 없습니다.";
  }
  if (stderr.includes("Did not get any data blocks")) {
    return "자막 데이터를 가져올 수 없습니다. 영상에 자막이 없거나 접근이 제한되어 있습니다.";
  }
  if (stderr.includes("Sign in to confirm your age")) {
    return "연령 제한이 있는 영상입니다. 자막을 가져올 수 없습니다.";
  }

  return "스크립트를 가져오는데 실패했습니다. 영상에 자막이 없거나 접근할 수 없습니다.";
}

// 자막 텍스트 정리 함수
function cleanSubtitleText(rawText: string): string {
  try {
    // VTT 또는 SRT 형식의 자막에서 텍스트만 추출
    let cleaned = rawText;

    // VTT 헤더 제거
    cleaned = cleaned.replace(/WEBVTT\s*\n/g, "");
    cleaned = cleaned.replace(/Kind:\s*captions\s*\n/g, "");
    cleaned = cleaned.replace(/Language:\s*\w+\s*\n/g, "");

    // 시간 스탬프 제거 (00:00:00.000 --> 00:00:05.000 형식)
    cleaned = cleaned.replace(
      /\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}/g,
      ""
    );

    // SRT 번호 제거
    cleaned = cleaned.replace(/^\d+\s*$/gm, "");

    // HTML 태그 제거
    cleaned = cleaned.replace(/<[^>]*>/g, "");

    // 특수 문자 제거
    cleaned = cleaned.replace(/&amp;/g, "&");
    cleaned = cleaned.replace(/&lt;/g, "<");
    cleaned = cleaned.replace(/&gt;/g, ">");
    cleaned = cleaned.replace(/&quot;/g, '"');

    // 중복 줄바꿈 제거
    cleaned = cleaned.replace(/\n\s*\n/g, "\n");

    // 앞뒤 공백 제거
    cleaned = cleaned.trim();

    // 빈 줄 제거하고 의미있는 텍스트만 남기기
    cleaned = cleaned
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim();
        return (
          trimmed.length > 0 &&
          !trimmed.match(/^\d+$/) && // 숫자만 있는 줄 제거
          !trimmed.match(/^\d{2}:\d{2}/) && // 시간 형식 줄 제거
          trimmed !== "WEBVTT"
        );
      })
      .join("\n");

    return cleaned;
  } catch (error) {
    console.error("자막 텍스트 정리 오류:", error);
    return rawText;
  }
}
