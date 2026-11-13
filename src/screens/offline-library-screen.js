import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native";
import { requestJson } from "./ayah-api";
import offlineStorage from "./offline-library-storage";
import offlineLibrary from "./offline-library";

const API_BASE = process.env.EXPO_PUBLIC_AYAH_API_URL || "";
const COLORS = { text:"#FFFFFF", muted:"#AAB6C7", panel:"#1B2A40", surface:"#24354C", gold:"#D9B96E", border:"#34445B" };
const languageCode = value => ({ English:"en", Urdu:"ur", Arabic:"ar", Bengali:"bn", Turkish:"tr", French:"fr", Indonesian:"id" }[value] || "en");

function Action({ title, onPress, secondary=false, disabled=false }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={{backgroundColor:secondary?COLORS.surface:COLORS.gold,borderRadius:12,padding:13,marginTop:9,opacity:disabled?0.5:1,borderWidth:secondary?1:0,borderColor:COLORS.border}}><Text style={{color:secondary?COLORS.text:"#101C2D",fontWeight:"800",textAlign:"center"}}>{title}</Text></Pressable>;
}

export default function OfflineLibraryScreen({ onBack, language="English" }) {
  const [chapters,setChapters]=useState([]);
  const [translations,setTranslations]=useState([]);
  const [translationId,setTranslationId]=useState("");
  const [selected,setSelected]=useState("1");
  const [query,setQuery]=useState("");
  const [downloads,setDownloads]=useState([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [progress,setProgress]=useState({done:0,total:0,name:""});
  const [error,setError]=useState("");
  const refreshDownloads=useCallback(async()=>{try{setDownloads(await offlineStorage.list());}catch(_){setError("Saved downloads could not be read from this device.");}},[]);
  useEffect(()=>{
    let active=true;
    Promise.all([
      requestJson("/chapters",{baseUrl:API_BASE}),
      requestJson("/translations?language="+encodeURIComponent(languageCode(language)),{baseUrl:API_BASE})
    ]).then(([chapterData,translationData])=>{
      if(!active)return;
      setChapters(Array.isArray(chapterData.chapters)?chapterData.chapters:[]);
      const items=Array.isArray(translationData.translations)?translationData.translations:[];
      setTranslations(items);
      setTranslationId(String(items.find(item=>String(item.id)==="131")?.id||items[0]?.id||""));
    }).catch(e=>{if(active)setError(e.message||"Connect the verified Qur’an content service to download surahs.");})
      .finally(()=>{if(active)setLoading(false);});
    refreshDownloads();
    return()=>{active=false;};
  },[language,refreshDownloads]);
  const downloadSelected=async()=>{
    const chapter=chapters.find(item=>String(item.id)===String(selected));
    if(!chapter){setError("Choose a surah first.");return;}
    if(!translationId){setError("Choose a translation before downloading.");return;}
    const total=Number(chapter.verses_count);
    if(!Number.isInteger(total)||total<1){setError("The surah information is incomplete.");return;}
    setBusy(true);setError("");setProgress({done:0,total,name:chapter.name_simple||"Surah"});
    try{
      const all=[];
      const pageSize=50;
      const pages=Math.ceil(total/pageSize);
      for(let page=1;page<=pages;page++){
        const data=await requestJson("/chapters/"+chapter.id+"/verses?page="+page+"&per_page="+pageSize+"&translation_id="+encodeURIComponent(translationId)+"&script=uthmani&language="+encodeURIComponent(languageCode(language)),{baseUrl:API_BASE,timeoutMs:30000});
        const batch=Array.isArray(data.verses)?data.verses:[];
        if(!batch.length)throw new Error("The content service returned an empty page. The surah was not saved.");
        all.push(...batch);
        setProgress({done:Math.min(all.length,total),total,name:chapter.name_simple||"Surah"});
      }
      const clean=offlineLibrary.createOfflineSurah({chapter,verses:all,translationId});
      await offlineStorage.save(clean);
      await refreshDownloads();
      Alert.alert("Surah saved offline",chapter.name_simple+" is now available in your offline library. Recitation audio has not been downloaded.");
    }catch(e){setError(e.message||"The surah could not be saved. Check your connection and try again.");}
    finally{setBusy(false);}
  };
  const removeDownload=async id=>{try{await offlineStorage.remove(id);await refreshDownloads();}catch(e){setError(e.message||"Could not remove this download.");}};
  const filtered=chapters.filter(ch=>(String(ch.name_simple||"")+" "+String(ch.name_arabic||"")+" "+String(ch.id)).toLowerCase().includes(query.toLowerCase()));
  const downloadedIds=new Set(downloads.map(item=>String(item.chapterId)));
  const totalBytes=downloads.reduce((sum,item)=>sum+Number(item.bytes||0),0);
  const formatBytes=bytes=>bytes<1024?bytes+" B":bytes<1024*1024?(bytes/1024).toFixed(1)+" KB":(bytes/1024/1024).toFixed(2)+" MB";
  return <>
    <View style={{marginBottom:16}}>
      <Text style={{color:COLORS.gold,fontSize:11,fontWeight:"800",letterSpacing:1}}>READ WITHOUT INTERNET</Text>
      <Text accessibilityRole="header" style={{color:COLORS.text,fontSize:27,fontWeight:"800",marginTop:5}}>Offline library</Text>
      <Text style={{color:COLORS.muted,fontSize:13,lineHeight:20,marginTop:8}}>Save selected surahs to this device using verified Arabic text and one chosen translation. Audio is stored separately.</Text>
    </View>
    <View style={{backgroundColor:COLORS.panel,borderRadius:16,borderWidth:1,borderColor:COLORS.border,padding:15,marginBottom:14}}>
      <Text style={{color:COLORS.text,fontWeight:"800",fontSize:17}}>Download a surah</Text>
      {loading?<ActivityIndicator color={COLORS.gold} style={{margin:20}}/>:<>
        <TextInput value={query} onChangeText={setQuery} placeholder="Find a surah…" placeholderTextColor={COLORS.muted} style={{color:COLORS.text,backgroundColor:COLORS.surface,borderRadius:10,padding:12,marginTop:12}}/>
        <View style={{maxHeight:240}}>
          {filtered.slice(0,30).map(ch=><Pressable key={ch.id} onPress={()=>setSelected(String(ch.id))} style={{paddingVertical:10,borderBottomWidth:1,borderBottomColor:COLORS.border,flexDirection:"row",alignItems:"center"}}>
            <Text style={{color:COLORS.gold,width:30}}>{ch.id}</Text>
            <View style={{flex:1}}><Text style={{color:COLORS.text,fontWeight:"700"}}>{ch.name_simple}</Text><Text style={{color:COLORS.muted,fontSize:11}}>{ch.verses_count} ayahs</Text></View>
            {downloadedIds.has(String(ch.id))?<Text style={{color:COLORS.gold,fontSize:11}}>SAVED</Text>:null}
            <Text style={{color:String(ch.id)===selected?COLORS.gold:COLORS.muted,fontSize:18,marginLeft:10}}>{String(ch.id)===selected?"●":"○"}</Text>
          </Pressable>)}
        </View>
        <Text style={{color:COLORS.muted,fontSize:11,marginTop:12}}>Translation</Text>
        {translations.slice(0,80).map(item=><Pressable key={item.id} onPress={()=>setTranslationId(String(item.id))} style={{paddingVertical:7,flexDirection:"row",alignItems:"center"}}>
          <Text style={{color:String(item.id)===translationId?COLORS.gold:COLORS.muted,marginRight:9}}>{String(item.id)===translationId?"●":"○"}</Text>
          <Text style={{color:COLORS.text,flex:1,fontSize:12}} numberOfLines={2}>{item.name}{item.author_name?" · "+item.author_name:""}</Text>
        </Pressable>)}
        <Action title={busy?"Downloading…":"Download selected surah"} onPress={downloadSelected} disabled={busy||!chapters.length}/>
        {busy?<View style={{marginTop:12}}><Text style={{color:COLORS.text,fontSize:12}}>{progress.name}: {progress.done} / {progress.total} ayahs</Text><View style={{height:8,backgroundColor:COLORS.surface,borderRadius:8,marginTop:7,overflow:"hidden"}}><View style={{height:8,width:(progress.total?Math.min(100,progress.done/progress.total*100):0)+"%",backgroundColor:COLORS.gold}}/></View></View>:null}
      </>}
      {error?<Text accessibilityRole="alert" style={{color:"#F0B7A8",marginTop:12,fontSize:12}}>{error}</Text>:null}
    </View>
    <View style={{backgroundColor:COLORS.panel,borderRadius:16,borderWidth:1,borderColor:COLORS.border,padding:15}}>
      <Text style={{color:COLORS.text,fontSize:17,fontWeight:"800"}}>Saved on this device</Text>
      <Text style={{color:COLORS.muted,fontSize:12,marginTop:5}}>{downloads.length} surahs · approximately {formatBytes(totalBytes)}</Text>
      {downloads.length===0?<Text style={{color:COLORS.muted,marginTop:14}}>No surahs downloaded yet.</Text>:downloads.map(item=><View key={item.chapterId} style={{paddingVertical:12,borderBottomWidth:1,borderBottomColor:COLORS.border}}>
        <Text style={{color:COLORS.text,fontWeight:"700"}}>{item.name}</Text>
        <Text style={{color:COLORS.muted,fontSize:11,marginTop:3}}>{item.ayahCount} ayahs · {formatBytes(item.bytes||0)} · {new Date(item.savedAt).toLocaleDateString()}</Text>
        <Action title="Remove download" secondary onPress={()=>Alert.alert("Remove offline surah?","This removes the saved text and translation from this device.",[{text:"Cancel",style:"cancel"},{text:"Remove",style:"destructive",onPress:()=>removeDownload(item.chapterId)}])}/>
      </View>)}
      <Action title="Refresh download list" secondary onPress={refreshDownloads}/>
    </View>
    <Text style={{color:COLORS.muted,fontSize:11,lineHeight:17,marginTop:14}}>Offline text and translation only. Recitation audio is not included. Downloaded material remains on this device and is not synced to an account.</Text>
    <Action title="Back" secondary onPress={onBack}/>
  </>;
}
