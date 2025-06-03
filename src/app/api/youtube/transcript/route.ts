import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

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

    try {
      // yt-dlp를 사용하여 자막 파일 다운로드
      const tempDir = `/tmp/yt-dlp-${Date.now()}`;
      const command = `mkdir -p ${tempDir} && cd ${tempDir} && yt-dlp --write-auto-sub --write-sub --sub-langs "ko,en" --skip-download --output "%(id)s.%(ext)s" "${videoUrl}"`;

      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30초 타임아웃
      });

      // 자막 파일 읽기
      let transcript = "";
      try {
        // 한국어 자막 우선 시도
        const koFiles = await execAsync(
          `find ${tempDir} -name "${videoId}*.ko.*" -type f | head -1`
        );
        if (koFiles.stdout.trim()) {
          const { stdout: koContent } = await execAsync(
            `cat "${koFiles.stdout.trim()}"`
          );
          transcript = koContent;
        } else {
          // 영어 자막 시도
          const enFiles = await execAsync(
            `find ${tempDir} -name "${videoId}*.en.*" -type f | head -1`
          );
          if (enFiles.stdout.trim()) {
            const { stdout: enContent } = await execAsync(
              `cat "${enFiles.stdout.trim()}"`
            );
            transcript = enContent;
          } else {
            // 모든 자막 파일 시도
            const allFiles = await execAsync(
              `find ${tempDir} -name "${videoId}*.*" -type f | head -1`
            );
            if (allFiles.stdout.trim()) {
              const { stdout: allContent } = await execAsync(
                `cat "${allFiles.stdout.trim()}"`
              );
              transcript = allContent;
            }
          }
        }
      } catch (readError) {
        console.error("자막 파일 읽기 오류:", readError);
      } finally {
        // 임시 디렉토리 정리
        await execAsync(`rm -rf ${tempDir}`).catch(() => {});
      }

      if (!transcript || transcript.trim() === "") {
        return NextResponse.json(
          { error: "이 영상에는 사용 가능한 자막이 없습니다." },
          { status: 404 }
        );
      }

      // 자막 텍스트 정리
      const cleanedTranscript = cleanSubtitleText(transcript);

      return NextResponse.json({ transcript: cleanedTranscript });
    } catch (execError: any) {
      console.error("yt-dlp 실행 오류:", execError);

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

      return NextResponse.json(
        {
          error:
            "스크립트를 가져오는데 실패했습니다. 영상에 자막이 없거나 접근할 수 없습니다.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("스크립트 가져오기 오류:", error);
    return NextResponse.json(
      { error: "스크립트를 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// 자막 텍스트 정리 함수
function cleanSubtitleText(rawText: string): string {
  try {
    // VTT 또는 SRT 형식의 자막에서 텍스트만 추출
    let cleaned = rawText;

    // VTT 헤더 제거
    cleaned = cleaned.replace(/WEBVTT\s*\n/g, "");

    // 시간 스탬프 제거 (00:00:00.000 --> 00:00:05.000 형식)
    cleaned = cleaned.replace(
      /\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}/g,
      ""
    );

    // SRT 번호 제거
    cleaned = cleaned.replace(/^\d+\s*$/gm, "");

    // HTML 태그 제거
    cleaned = cleaned.replace(/<[^>]*>/g, "");

    // 중복 줄바꿈 제거
    cleaned = cleaned.replace(/\n\s*\n/g, "\n");

    // 앞뒤 공백 제거
    cleaned = cleaned.trim();

    // 빈 줄 제거
    cleaned = cleaned
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .join("\n");

    return cleaned;
  } catch (error) {
    console.error("자막 텍스트 정리 오류:", error);
    return rawText;
  }
}
