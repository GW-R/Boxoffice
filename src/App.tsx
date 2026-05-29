import { useState, useEffect, ChangeEvent } from "react";
import { 
  Calendar, 
  Sun, 
  Moon, 
  ChevronRight, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Film, 
  Clock, 
  Users, 
  Globe, 
  Info, 
  RefreshCw, 
  Award,
  CircleCheck,
  TrendingUp as RankUpIcon,
  HelpCircle
} from "lucide-react";
import type { 
  DailyBoxOfficeItem, 
  MovieInfo, 
  KOBISBoxOfficeResponse, 
  KOBISMovieResponse 
} from "./types";

export default function App() {
  // Compute Yesterday as the default target date
  const getYesterdayDateString = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yyyy = yesterday.getFullYear();
    const mm = String(yesterday.getMonth() + 1).padStart(2, "0");
    const dd = String(yesterday.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const yesterdayStr = getYesterdayDateString();

  // Load theme preference from localStorage on mount
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      return savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return false;
  });

  const [selectedDate, setSelectedDate] = useState<string>(yesterdayStr);
  const [boxOfficeList, setBoxOfficeList] = useState<DailyBoxOfficeItem[]>([]);
  const [selectedMovieCd, setSelectedMovieCd] = useState<string | null>(null);
  const [movieDetails, setMovieDetails] = useState<MovieInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Loading & Error States
  const [isLoadingBoxOffice, setIsLoadingBoxOffice] = useState<boolean>(false);
  const [isLoadingMovie, setIsLoadingMovie] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Apply Dark Mode class to the wrapper
  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Fetch box office data whenever date changes
  const fetchBoxOffice = async (dateStr: string) => {
    const targetDt = dateStr.replace(/-/g, "");
    setIsLoadingBoxOffice(true);
    setError(null);
    try {
      const response = await fetch(`/api/boxoffice?targetDt=${targetDt}`);
      if (!response.ok) {
        throw new Error(`서버에서 데이터를 가져오지 못했습니다. (Status: ${response.status})`);
      }
      const data: KOBISBoxOfficeResponse = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const list = data.boxOfficeResult?.dailyBoxOfficeList || [];
      setBoxOfficeList(list);

      // Default-select the first movie in the list if available
      if (list.length > 0) {
        setSelectedMovieCd(list[0].movieCd);
      } else {
        setSelectedMovieCd(null);
        setMovieDetails(null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "알 수 없는 오류가 발생했습니다.");
      setBoxOfficeList([]);
      setSelectedMovieCd(null);
      setMovieDetails(null);
    } finally {
      setIsLoadingBoxOffice(false);
    }
  };

  // Fetch movie details whenever selected movie code changes
  const fetchMovieDetails = async (movieCd: string) => {
    setIsLoadingMovie(true);
    setDetailError(null);
    try {
      const response = await fetch(`/api/movie?movieCd=${movieCd}`);
      if (!response.ok) {
        throw new Error(`서버에서 상세 데이터를 가져오지 못했습니다. (Status: ${response.status})`);
      }
      const data: KOBISMovieResponse = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.movieInfoResult?.movieInfo) {
        setMovieDetails(data.movieInfoResult.movieInfo);
      } else {
        throw new Error("영화 상세 정보 데이터를 찾을 수 없습니다.");
      }
    } catch (err: any) {
      console.error(err);
      setDetailError(err.message || "영화 상세 정보를 가져오는데 실패했습니다.");
      setMovieDetails(null);
    } finally {
      setIsLoadingMovie(false);
    }
  };

  useEffect(() => {
    fetchBoxOffice(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (selectedMovieCd) {
      fetchMovieDetails(selectedMovieCd);
    }
  }, [selectedMovieCd]);

  // Helper selectors
  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Utilities for rendering numbers
  const formatNumber = (num: string | number) => {
    return Number(num).toLocaleString("ko-KR");
  };

  // Format amount as Korean Won
  const formatCurrency = (amt: string | number) => {
    const value = Number(amt);
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억원`;
    }
    return `${formatNumber(value)}원`;
  };

  // Filter box office list by query
  const filteredList = boxOfficeList.filter(item => 
    item.movieNm.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find associated list item for additional real-time box office stats
  const selectedListItem = boxOfficeList.find(item => item.movieCd === selectedMovieCd);

  return (
    <div className={`min-h-screen font-sans transition-all duration-300 ${isDarkMode ? "dark bg-[#09090b] text-zinc-100" : "bg-zinc-50 text-zinc-900"}`}>
      
      {/* Header Section */}
      <header className={`border-b transition-all duration-350 ${isDarkMode ? "border-zinc-800 bg-[#09090b]/80" : "border-zinc-200 bg-white/80"} backdrop-blur sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Bento Logo Brand */}
          <div className="flex flex-col">
            <span className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1">
              KOBIS Open API Interface
            </span>
            <div className="flex items-center gap-2">
              <Film className="w-6 h-6 text-blue-500 animate-pulse" />
              <h1 className="text-2xl sm:text-3.5xl font-black tracking-tighter italic uppercase font-display leading-none">
                BoxOffice<span className="text-blue-500">.</span>Daily
              </h1>
            </div>
          </div>

          {/* Right Header Controls Styled as a Bento Cell */}
          <div className="flex items-center gap-4 wrap">
            <div className={`flex items-center gap-3 border p-2 rounded-2xl transition-all ${
              isDarkMode 
                ? "bg-zinc-900/45 border-zinc-800 focus-within:border-blue-500/50" 
                : "bg-white border-zinc-200 focus-within:border-blue-500/50 shadow-xs"
            }`}>
              <div className="flex flex-col px-3 border-r border-zinc-800/10 dark:border-zinc-850">
                <label className="text-[9px] uppercase text-zinc-450 dark:text-zinc-500 font-extrabold tracking-wider">
                  Target Date
                </label>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={handleDateChange}
                  max={yesterdayStr}
                  className="bg-transparent text-xs sm:text-sm font-bold outline-hidden cursor-pointer w-[125px]"
                  style={{ colorScheme: isDarkMode ? "dark" : "light" }}
                />
              </div>

              {/* Theme Toggler Icon Badge */}
              <div className="flex items-center gap-1.5 pr-1">
                <button
                  onClick={toggleTheme}
                  id="theme-toggler"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isDarkMode 
                      ? "bg-zinc-800 text-amber-400 hover:bg-zinc-700 hover:scale-105" 
                      : "bg-zinc-100 text-zinc-650 hover:bg-zinc-200 hover:scale-105"
                  }`}
                  aria-label="Toggle visual layout mode"
                  title={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 min-h-0">
        
        {/* Notice of standard movie info */}
        <section className={`mb-8 p-5 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 ${
          isDarkMode 
            ? "border-zinc-800/90 bg-zinc-900/20" 
            : "border-zinc-200 bg-white shadow-xs"
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-500 tracking-wider inline-block">
                LIVE METRICS
              </span>
              <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 font-mono">
                {selectedDate.replace(/-/g, ".")} UPDATE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase font-display">
              {(() => {
                const parts = selectedDate.split("-");
                return `${parts[0]}년 ${parts[1]}월 ${parts[2]}일`;
              })()} 종합 박스오피스 상영 목록
            </h2>
          </div>
          
          <div className="text-xs text-zinc-550 dark:text-zinc-400 flex items-center gap-2 max-w-sm">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <p className="leading-tight">
              KOBIS 통합전산망 공식 관객 집계 전일 기준 실시간 데이터입니다. (오늘 이전 날짜만 탐색이 가능합니다)
            </p>
          </div>
        </section>

        {/* Dynamic Grill Split Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Panel: Rankings list occupying 5 spans */}
          <section className="lg:col-span-5 flex flex-col gap-3 min-h-0">
            <div className="flex items-center justify-between px-2 mb-1">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa] dark:text-zinc-400">
                Top Rankings ({filteredList.length})
              </h2>
              <span className="text-[10px] text-blue-500 dark:text-blue-400 font-mono tracking-wider">
                Rank Updated: 전일 기준
              </span>
            </div>

            {/* Simple Elegant Search Filter Built into Bento styling */}
            <div className={`p-2 px-3 rounded-2xl border flex items-center gap-2 mb-2 transition-all ${
              isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
            }`}>
              <Search className="w-4 h-4 text-zinc-450 dark:text-zinc-550 shrink-0" />
              <input 
                type="text" 
                placeholder="영화 제목 검색 및 필터"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-xs sm:text-sm bg-transparent border-0 focus:outline-hidden focus:ring-0 ${
                  isDarkMode ? "text-zinc-100 placeholder-zinc-600" : "text-zinc-900 placeholder-zinc-400"
                }`}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="px-2 py-0.5 text-[10px] rounded bg-zinc-200 dark:bg-zinc-850 text-zinc-500 dark:text-zinc-400 font-semibold"
                >
                  지우기
                </button>
              )}
            </div>

            {/* Error States */}
            {error && (
              <div className="p-6 rounded-2xl border border-rose-300 dark:border-rose-950 bg-rose-500/5 text-rose-500 dark:text-rose-450 text-center">
                <p className="font-bold text-xs mb-1">데이터 동기화 실패</p>
                <p className="text-[10px] mb-3 leading-relaxed">{error}</p>
                <button
                  onClick={() => fetchBoxOffice(selectedDate)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-colors border border-rose-500/10"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  다시 검색하기
                </button>
              </div>
            )}

            {/* Skeletons */}
            {isLoadingBoxOffice ? (
              <div className="flex flex-col gap-2.5">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-[72px] animate-pulse rounded-2xl border ${
                      isDarkMode ? "bg-zinc-900/60 border-zinc-850" : "bg-white border-zinc-100"
                    }`}
                  />
                ))}
              </div>
            ) : (
              <>
                {/* Empty Lists */}
                {filteredList.length === 0 && !error && (
                  <div className={`p-12 text-center rounded-2xl border border-dashed text-zinc-450 dark:text-zinc-600 ${
                    isDarkMode ? "border-zinc-800 bg-zinc-950/20" : "border-zinc-200 bg-white"
                  }`}>
                    <Film className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-semibold">데이터를 찾을 수 없습니다.</p>
                    <p className="text-[11px] mt-1 opacity-70">
                      {searchQuery ? "조회된 목록에 해당 제목의 영화가 없습니다." : "선택 데이터 기준 실적이 존재하지 않습니다."}
                    </p>
                  </div>
                )}

                {/* Vertical Scroll Ranking Container */}
                <div className="flex flex-col gap-2.5 max-h-[640px] overflow-y-auto pr-1">
                  {filteredList.map((item) => {
                    const isSelected = item.movieCd === selectedMovieCd;
                    
                    // Format rank diff indicators
                    const rankDiff = parseInt(item.rankInten, 10);
                    let rankBadge = null;
                    if (item.rankOldAndNew === "NEW") {
                      rankBadge = (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-tighter">
                          NEW
                        </span>
                      );
                    } else if (rankDiff > 0) {
                      rankBadge = <span className="text-[10px] font-black text-rose-500">▲ {rankDiff}</span>;
                    } else if (rankDiff < 0) {
                      rankBadge = <span className="text-[10px] font-black text-blue-500">▼ {Math.abs(rankDiff)}</span>;
                    } else {
                      rankBadge = <span className="text-[10px] font-bold text-zinc-400">-</span>;
                    }

                    return (
                      <button
                        key={item.movieCd}
                        id={`movie-item-${item.movieCd}`}
                        onClick={() => setSelectedMovieCd(item.movieCd)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group ${
                          isSelected
                            ? isDarkMode
                              ? "bg-zinc-900/60 border-blue-500/50 shadow-md shadow-blue-500/5"
                              : "bg-blue-50/30 border-blue-400 shadow-sm"
                            : isDarkMode
                              ? "bg-zinc-900/40 border-zinc-850 hover:bg-zinc-850/60 hover:border-zinc-700"
                              : "bg-white border-zinc-200 hover:bg-zinc-100/50 hover:border-zinc-300"
                        }`}
                      >
                        {/* Display rank in italicised large display number */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className={`text-2xl sm:text-3xl font-black italic tracking-tighter w-8 shrink-0 text-center ${
                            isSelected
                              ? isDarkMode ? "text-blue-500" : "text-blue-600"
                              : isDarkMode ? "text-zinc-750" : "text-zinc-300"
                          }`}>
                            {String(item.rank).padStart(2, "0")}
                          </span>

                          <div className="min-w-0">
                            <h3 className={`font-bold text-sm sm:text-base leading-tight group-hover:text-blue-500 transition-colors truncate ${
                              isSelected ? "text-blue-600 dark:text-blue-400 font-extrabold" : "text-zinc-800 dark:text-zinc-200"
                            }`}>
                              {item.movieNm}
                            </h3>
                            <p className="text-[11px] text-zinc-450 dark:text-zinc-500 uppercase mt-0.5 tracking-tight flex flex-wrap items-center gap-x-2">
                              <span>개봉일: {item.openDt}</span>
                              <span className="opacity-40">|</span>
                              <span>관객 수: {formatNumber(item.audiCnt)}명</span>
                            </p>
                          </div>
                        </div>

                        {/* Rank indicator delta badge */}
                        <div className="shrink-0 flex items-center gap-2">
                          {rankBadge}
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          {/* Right Panel: Movie Details (Stylized Bento Grid occupies 7 spans) */}
          <section className="lg:col-span-7 lg:sticky lg:top-[96px]">
            
            {/* Bento Containers for Detailed Stats */}
            {isLoadingMovie ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
                <div className="sm:col-span-2 h-[160px] bg-zinc-900/50 rounded-3xl" />
                <div className="h-[140px] bg-zinc-900/50 rounded-3xl" />
                <div className="h-[140px] bg-zinc-900/50 rounded-3xl" />
                <div className="sm:col-span-2 h-[220px] bg-zinc-900/50 rounded-3xl" />
              </div>
            ) : movieDetails ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Poster Visual Header Bento Block */}
                <div className="sm:col-span-2 bg-gradient-to-t from-black via-zinc-900/90 to-zinc-950 border border-zinc-200 dark:border-zinc-805 rounded-3xl p-6 relative overflow-hidden min-h-[160px] flex flex-col justify-end">
                  {/* Backdrop glow aura */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="flex flex-wrap gap-2 items-center mb-2">
                      <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded mb-1 inline-block uppercase tracking-wider">
                        Selected Movie
                      </span>
                      {movieDetails.typeNm && (
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-350 text-[9px] font-bold rounded mb-1 inline-block uppercase">
                          {movieDetails.typeNm}
                        </span>
                      )}
                      {movieDetails.audits?.[0]?.watchGradeNm && (
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-350 text-[9px] font-extrabold rounded mb-1 inline-block">
                          {movieDetails.audits[0].watchGradeNm}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl sm:text-3.5xl font-black italic tracking-tighter uppercase font-display text-white leading-tight">
                      {movieDetails.movieNm}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-400 font-semibold mt-1 truncate">
                      {movieDetails.movieNmEn || "No English Title Registered"} {movieDetails.prdtYear ? `, ${movieDetails.prdtYear}` : ""}
                    </p>
                  </div>
                </div>

                {/* 2. Stats Bento 1 (Audience Count Metrics) */}
                <div className={`border rounded-3xl p-6 flex flex-col justify-between min-h-[140px] transition-all hover:scale-[1.01] ${
                  isDarkMode 
                    ? "bg-[#18181b]/70 border-zinc-800 hover:border-zinc-700" 
                    : "bg-white border-zinc-200 hover:border-zinc-300 shadow-sm"
                }`}>
                  <p className="text-[10px] uppercase font-bold text-zinc-450 dark:text-zinc-500 tracking-widest flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    Audience Count (관객)
                  </p>
                  <div className="mt-4">
                    <p className="text-3xl font-black tracking-tight font-display text-zinc-900 dark:text-zinc-105">
                      {selectedListItem ? `${formatNumber(selectedListItem.audiCnt)}` : "0"}명
                    </p>
                    <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 font-semibold">
                      누적 관객: {selectedListItem ? `${formatNumber(selectedListItem.audiAcc)}` : "0"}명
                    </p>
                  </div>
                </div>

                {/* 3. Stats Bento 2 (Screen Share / Revenue Metrics) */}
                <div className={`border rounded-3xl p-6 flex flex-col justify-between min-h-[140px] transition-all hover:scale-[1.01] ${
                  isDarkMode 
                    ? "bg-[#18181b]/70 border-zinc-800 hover:border-zinc-700" 
                    : "bg-white border-zinc-200 hover:border-zinc-300 shadow-sm"
                }`}>
                  <p className="text-[10px] uppercase font-bold text-zinc-455 dark:text-zinc-500 tracking-widest flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-500" />
                    Accumulated Revenue (매출)
                  </p>
                  <div className="mt-4">
                    <p className="text-3xl font-black tracking-tight font-display text-zinc-90s dark:text-zinc-105">
                      {selectedListItem ? `${selectedListItem.salesShare}%` : "0%"}
                    </p>
                    <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1 font-semibold truncate">
                      누적 매출액: {selectedListItem ? formatCurrency(selectedListItem.salesAcc) : "0원"}
                    </p>
                  </div>
                </div>

                {/* 4. Complete Credits Info Bento Block */}
                <div className={`sm:col-span-2 border rounded-3xl p-6 ${
                  isDarkMode ? "bg-[#18181b]/70 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
                }`}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    
                    {/* Director section */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold text-zinc-450 dark:text-zinc-550 tracking-widest flex items-center gap-1">
                        Director (감독)
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        {movieDetails.directors && movieDetails.directors.length > 0
                          ? movieDetails.directors.map(d => d.peopleNm).join(", ")
                          : "감독 미상"}
                      </p>
                    </div>

                    {/* Genres / Country */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold text-zinc-450 dark:text-zinc-555 tracking-widest flex items-center gap-1">
                        Genre / Nations
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-zinc-850 dark:text-zinc-200">
                        {movieDetails.genres?.map(g => g.genreNm).join(", ") || "장르 정보 없음"}
                        <span className="text-[10px] block opacity-60 font-medium">
                          ({movieDetails.nations?.map(n => n.nationNm).join(", ") || "제작국가 없음"})
                        </span>
                      </p>
                    </div>

                    {/* Runtime */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold text-zinc-450 dark:text-zinc-555 tracking-widest flex items-center gap-1">
                        Runtime (상영시간)
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-zinc-850 dark:text-zinc-200">
                        {movieDetails.showTm ? `${movieDetails.showTm}분` : "상영시간 공란"}
                      </p>
                    </div>

                    {/* Cast List spanning columns */}
                    <div className="flex flex-col gap-1.5 sm:col-span-3 border-t border-zinc-200/50 dark:border-zinc-800 pt-4">
                      <span className="text-[9px] uppercase font-bold text-zinc-450 dark:text-zinc-555 tracking-widest">
                        Cast List (핵심 출연배우)
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {movieDetails.actors && movieDetails.actors.length > 0
                          ? movieDetails.actors.slice(0, 10).map(a => `${a.peopleNm}${a.cast ? `(역: ${a.cast})` : ""}`).join(", ")
                          : "별도 등록된 배우진 정보 없음"}
                        {movieDetails.actors && movieDetails.actors.length > 10 && " 외 다수"}
                      </p>
                    </div>

                    {/* Associated Companies list */}
                    {movieDetails.companys && movieDetails.companys.length > 0 && (
                      <div className="flex flex-col gap-1.5 sm:col-span-3 border-t border-zinc-200/50 dark:border-zinc-800 pt-4">
                        <span className="text-[9px] uppercase font-bold text-zinc-450 dark:text-zinc-555 tracking-widest">
                          Associated Business (배급/제작사)
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {movieDetails.companys.slice(0, 3).map((c, i) => (
                            <span 
                              key={i} 
                              className={`text-[10px] px-2.5 py-1 rounded inline-flex items-center gap-1 border ${
                                isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-zinc-50 border-zinc-200 text-zinc-650"
                              }`}
                            >
                              <strong className="text-blue-500">{c.companyPartNm}</strong>
                              <span className="opacity-30">|</span>
                              <span>{c.companyNm}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* 5. External Actions Bento Block */}
                <div className="sm:col-span-2 grid grid-cols-2 gap-3.5">
                  <a
                    href={`https://www.youtube.com/results?search_query=영화+${encodeURIComponent(movieDetails.movieNm)}+예고편`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center py-3 px-4 rounded-2xl font-bold text-xs bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/20 hover:border-rose-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Film className="w-4 h-4" />
                    YouTube 예고편
                  </a>
                  <a
                    href={`https://search.naver.com/search.naver?query=영화+${encodeURIComponent(movieDetails.movieNm)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center py-3 px-4 rounded-2xl font-bold text-xs bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-500/20 hover:border-emerald-650 transition-all flex items-center justify-center gap-2"
                  >
                    포털 정보 검색
                  </a>
                </div>

              </div>
            ) : (
              <div className={`p-16 text-center rounded-3xl border border-dashed text-zinc-450 dark:text-zinc-600 ${
                isDarkMode ? "border-zinc-800 bg-zinc-950/10" : "border-zinc-200 bg-white"
              }`}>
                <Film className="w-12 h-12 mx-auto mb-4 opacity-25 text-blue-500" />
                <p className="text-sm font-bold tracking-tight">선택된 영화 없음</p>
                <p className="text-xs mt-1 leading-relaxed opacity-80">
                  왼쪽 인기 상위 박스오피스 목록에서 영화를 선택하면 이곳에 정돈된 벤토 그리드 상세 스펙 데이터가 로드됩니다.
                </p>
              </div>
            )}

            {/* Minor detail error banner */}
            {detailError && (
              <div className="mt-4 p-4 rounded-2xl border border-rose-950/30 bg-rose-600/5 text-rose-500 text-xs text-center">
                상세 로드 오류 발생: {detailError}
              </div>
            )}

          </section>

        </div>

      </main>

      {/* Footer design matching the template */}
      <footer className={`border-t py-12 mt-20 text-xs font-semibold ${
        isDarkMode ? "border-zinc-800 text-zinc-500" : "border-zinc-200 text-zinc-500"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex gap-8">
            <div className="flex flex-col align-left">
              <p className="text-[9px] text-zinc-650 uppercase font-black tracking-wider">API Provider</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-400 font-bold mt-0.5">Korean Film Council (KOBIS)</p>
            </div>
            <div className="flex flex-col align-left">
              <p className="text-[9px] text-zinc-650 uppercase font-black tracking-wider">Environment</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-400 font-mono mt-0.5">D-711-X-STABLE</p>
            </div>
          </div>
          <p className="text-[10px] text-zinc-650 font-bold tracking-wide">
            DESIGNED FOR BOX OFFICE ANALYTICS • © 2026 KOBIS DASHBOARD
          </p>
        </div>
      </footer>

    </div>
  );
}
